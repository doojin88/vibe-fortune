# 토스페이먼츠 구독 결제 시스템 가이드

## 개요
토스페이먼츠 자동결제(빌링)를 사용한 구독형 서비스 구현 가이드

---

## 1. 자동결제(빌링)란?

### 1.1 개념
**자동결제(빌링)**는 고객이 최초 1회 결제 정보를 등록하면, 이후 별도 인증 없이 자동으로 결제되는 방식입니다.

**⚠️ 중요**: 자동결제 API는 토스페이먼츠와 **추가 계약이 필요한 기능**입니다. 사용 전 반드시 계약을 완료해야 합니다.

### 1.2 사용 케이스
- 구독형 서비스 (OTT, 음악 스트리밍)
- 정기 배송
- 월간 멤버십

### 1.3 핵심 개념

| 용어 | 설명 |
|------|------|
| **빌링키 (Billing Key)** | 고객의 카드 정보를 암호화하여 저장한 토큰 |
| **Customer Key** | 고객을 식별하는 고유 키 (⚠️ **UUID 등 추정 불가능한 값** 사용 필수) |
| **정기 결제** | 빌링키를 사용하여 주기적으로 자동 결제 |

---

## 2. 구독 결제 플로우

### 2.1 전체 흐름

```
1단계: 빌링키 발급
   ↓
2단계: 최초 결제
   ↓
3단계: 정기 결제 (스케줄링)
   ↓
4단계: 구독 관리 (취소/재시작)
```

---

## 3. 1단계: 빌링키 발급

### 3.1 클라이언트 (빌링키 발급 요청)

**SDK v2 사용**:

```html
<script src="https://js.tosspayments.com/v2"></script>
<script>
  const tossPayments = TossPayments('YOUR_CLIENT_KEY');
  const payment = tossPayments.payment();

  // 빌링키 발급 요청
  payment.requestBillingAuth({
    customerKey: crypto.randomUUID(),  // ⚠️ 추정 불가능한 UUID 사용
    successUrl: window.location.origin + '/subscription/success',
    failUrl: window.location.origin + '/subscription/fail',
  });
</script>
```

**주요 파라미터**:
- `customerKey`: **⚠️ 보안 중요** - UUID 등 추정 불가능한 랜덤 값 사용 (이메일, 전화번호 등 추정 가능한 값 금지)
- `successUrl`: 빌링키 발급 성공 시 리다이렉트 URL
- `failUrl`: 빌링키 발급 실패 시 리다이렉트 URL

### 3.2 사용자 동작
1. 토스페이먼츠 결제창 표시
2. 카드 정보 입력 (카드 번호, 유효기간, CVC)
3. 카드사 인증 (간편 비밀번호 또는 SMS)

### 3.3 서버 (빌링키 승인)

**successUrl로 리다이렉트 후 처리**:

```typescript
// Query Parameters: authKey, customerKey

// 1. 빌링키 발급 승인 API 호출
const response = await fetch(
  'https://api.tosspayments.com/v1/billing/authorizations/issue',  // ⚠️ /issue 엔드포인트 사용
  {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authKey: authKey,
      customerKey: customerKey,
    }),
  }
);

const { billingKey } = await response.json();

// 2. 빌링키 저장 (데이터베이스)
// - billing_key
// - customer_key
// - status: 'active'
```

**중요**:
- `authKey`는 일회용이며 **짧은 시간 내** 사용해야 함 (발급 후 즉시 처리 권장)
- 발급받은 `billingKey`는 안전하게 서버에만 저장

---

## 4. 2단계: 최초 결제

빌링키 발급 직후 즉시 첫 결제를 실행합니다.

```typescript
// 빌링키로 결제 API 호출
const response = await fetch(
  `https://api.tosspayments.com/v1/billing/${billingKey}`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),  // ⚠️ 중복 결제 방지
    },
    body: JSON.stringify({
      customerKey: customerKey,
      amount: 9900,
      orderId: 'order_' + crypto.randomUUID(),  // ⚠️ 매번 고유한 UUID 사용
      orderName: '사주 분석 Pro 구독 (첫 결제)',
      customerEmail: 'user@example.com',
      customerName: '홍길동',
    }),
  }
);

// 결제 성공 시
if (response.ok) {
  // - users.is_pro = true
  // - users.test_count += 10
  // - subscriptions.next_payment_date = 현재 + 1개월
  // - subscriptions.last_payment_date = 현재
}
```

**주요 파라미터**:
- `amount`: 결제 금액 (원 단위)
- `orderId`: **매 결제마다 고유**해야 함 (6~64자, UUID 권장)
- `orderName`: 결제 내역에 표시될 이름
- `Idempotency-Key`: 네트워크 오류 등으로 인한 중복 결제 방지

---

## 5. 3단계: 정기 결제 (스케줄링)

### 5.1 Supabase Cron 설정

**Supabase SQL Editor에서 실행**:

```sql
SELECT cron.schedule(
  'daily-subscription-billing',
  '0 17 * * *',  -- 매일 17:00 UTC (한국 02:00)
  $$
  SELECT net.http_post(
    url := 'https://yourdomain.com/api/cron/process-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**중요**:
- Supabase Cron은 UTC 시간대 사용
- 한국 시간 02:00 = UTC 전날 17:00

### 5.2 정기 결제 API 구현

**엔드포인트**: `POST /api/cron/process-subscriptions`

```typescript
export async function POST(req: Request) {
  // 1. 요청 검증
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_CRON_REQUEST_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 오늘이 결제일인 구독 조회
  const subscriptions = await supabase
    .from('subscriptions')
    .select('*')
    .eq('next_payment_date', today)
    .in('status', ['active', 'cancellation_pending']);

  // 3. 각 구독 처리
  for (const sub of subscriptions) {
    if (sub.status === 'cancellation_pending') {
      // 취소 예정 건: 해지 처리
      await handleCancellation(sub);
    } else {
      // 활성 건: 결제 시도
      await processPayment(sub);
    }
  }

  return Response.json({ success: true });
}
```

### 5.3 결제 처리 로직

```typescript
async function processPayment(subscription) {
  try {
    // 빌링키로 결제
    const response = await fetch(
      `https://api.tosspayments.com/v1/billing/${subscription.billing_key}`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),  // ⚠️ 중복 결제 방지
        },
        body: JSON.stringify({
          customerKey: subscription.customer_key,
          amount: 9900,
          orderId: 'renewal_' + crypto.randomUUID(),  // ⚠️ UUID 사용
          orderName: '사주 분석 Pro 구독 (정기결제)',
        }),
      }
    );

    if (response.ok) {
      // 결제 성공
      // - users.test_count += 10
      // - subscriptions.next_payment_date += 1개월
      // - subscriptions.last_payment_date = 오늘
      // - payment_history에 성공 기록
    } else {
      // 결제 실패
      // - subscriptions.status = 'failed'
      // - users.is_pro = false
      // - payment_history에 실패 기록
      // ⚠️ 주의: 빌링키는 삭제하지 않고 상태만 변경 (재시도 가능하도록)
    }
  } catch (error) {
    // 에러 처리
  }
}
```

---

## 6. 4단계: 구독 관리

### 6.1 구독 취소

```typescript
// 사용자가 취소 신청
// - subscriptions.status = 'cancellation_pending'
// - 다음 결제일까지 Pro 혜택 유지
```

**취소 예정 상태 처리** (Cron에서):

```typescript
async function handleCancellation(subscription) {
  // 1. 구독 상태 변경
  await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('id', subscription.id);

  // 2. Pro 상태 해제
  await supabase
    .from('users')
    .update({ is_pro: false })
    .eq('clerk_user_id', subscription.customer_key);

  // ⚠️ 주의: 빌링키는 삭제하지 않음
  // - 토스페이먼츠 공식 가이드에 빌링키 삭제 API 미제공
  // - DB에서 상태값만 'expired'로 관리
  // - 재구독 시 새로운 빌링키 발급 필요
}
```

### 6.2 취소 철회

```typescript
// 취소 예정 상태에서 철회
// - subscriptions.status = 'active'
// - 다음 결제일에 정상 결제 진행
```

---

## 7. 인증 방식 (Basic Auth)

### 7.1 시크릿 키 인코딩

토스페이먼츠 API는 **Basic 인증** 방식을 사용합니다.

```typescript
const authorization = 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
```

**중요**:
- 시크릿 키 뒤에 콜론(`:`) 추가
- Base64로 인코딩
- 절대 클라이언트에 노출 금지

### 7.2 환경별 키

| 환경 | 키 접두어 | 용도 |
|------|----------|------|
| 테스트 | `test_ck_...`, `test_sk_...` | 개발 및 테스트 (실제 결제 없음) |
| 라이브 | `live_ck_...`, `live_sk_...` | 실제 운영 환경 |

---

## 8. 구독 상태 관리

### 8.1 구독 상태

| 상태 | 코드 | 설명 | 다음 액션 |
|------|------|------|-----------|
| 활성 | `active` | 정상 구독 중 | 결제일에 자동 결제 |
| 취소 예정 | `cancellation_pending` | 다음 결제일까지 유효 | 결제일에 해지 처리 |
| 만료 | `expired` | 해지 완료 | 재구독 시 빌링키 재발급 |
| 실패 | `failed` | 결제 실패로 해지 | 재구독 시 빌링키 재발급 |

### 8.2 상태 전이

```
active ──(사용자 취소 신청)──> cancellation_pending
  │                                   │
  │                                   │
  └─(결제 실패)─> failed        └─(결제일 도래)─> expired
                                      │
                                      │
                                 └─(취소 철회)─> active
```

---

## 9. 주요 API 엔드포인트

### 9.1 빌링키 관련

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| `POST` | `/v1/billing/authorizations/issue` | 빌링키 발급 승인 ⚠️ |

**⚠️ 중요**: 빌링키 삭제 API는 공식 가이드에 미제공됩니다. 상태값만 DB에서 관리하세요.

### 9.2 결제 관련

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| `POST` | `/v1/billing/{billingKey}` | 빌링키로 결제 (Idempotency-Key 필수 권장) |

---

## 10. 환경 변수

```bash
# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...  # 클라이언트용 (SDK 초기화)
TOSS_SECRET_KEY=test_sk_...              # 서버용 (API 호출)
```

---

## 11. 필수 패키지

```bash
npm install @tosspayments/tosspayments-sdk
```

---

## 12. 주의사항 및 베스트 프랙티스

### ✅ 반드시 지켜야 할 사항

1. **자동결제 계약 확인**
   - 자동결제 API는 토스페이먼츠와 **추가 계약 필요**
   - 계약 없이는 API 사용 불가

2. **orderId 고유성**
   - 매 결제마다 고유한 `orderId` 사용 (6~64자, UUID 권장)

3. **customerKey 보안**
   - ⚠️ **UUID 등 추정 불가능한 랜덤 값** 사용 필수
   - 이메일, 전화번호 등 추정 가능한 값 사용 금지

4. **빌링키 보안**
   - 빌링키는 서버에만 저장
   - 절대 클라이언트 노출 금지

5. **시크릿 키 보안**
   - `TOSS_SECRET_KEY`는 서버 환경 변수에만 저장
   - 클라이언트 코드나 Git에 포함 금지

6. **authKey 유효 시간**
   - 빌링키 발급 승인은 **짧은 시간 내** 완료 (발급 후 즉시 처리 권장)

7. **결제 실패 처리**
   - ⚠️ 결제 실패 시 **빌링키 삭제하지 않음** (삭제 API 미제공)
   - DB에서 구독 상태만 'failed'로 변경
   - 사용자에게 실패 알림

8. **멱등성 보장**
   - 모든 결제 요청에 `Idempotency-Key` 헤더 추가 권장
   - 네트워크 오류로 인한 중복 결제 방지

### ✅ 권장 사항

1. **테스트 환경 활용**
   - 테스트 키로 충분히 테스트 후 라이브 전환
   - 테스트 환경에서는 실제 결제 발생하지 않음

2. **결제 이력 저장**
   - 모든 결제 시도를 `payment_history` 테이블에 기록
   - 성공/실패 여부, 에러 메시지 포함

3. **Customer Key 설계**
   - ⚠️ **UUID 등 추정 불가능한 랜덤 값** 사용
   - Clerk User ID와 별도로 생성하여 매핑 관리
   - 고객당 하나의 빌링키만 유지

4. **Cron 실행 로그**
   - Supabase Dashboard에서 Cron 실행 로그 확인
   - 실패 시 알림 설정

---

## 13. 참고 자료

### 13.1 공식 문서
- [자동결제(빌링) 이해하기](https://docs.tosspayments.com/guides/v2/billing.md)
- [자동결제(빌링) 결제창 연동하기](https://docs.tosspayments.com/guides/v2/billing/integration.md)
- [구독 결제 서비스 구현하기 (1) 빌링키 발급](https://docs.tosspayments.com/blog/subscription-service-1.md)
- [구독 결제 서비스 구현하기 (2) 스케줄링](https://docs.tosspayments.com/blog/subscription-service-2.md)
- [Basic 인증과 Bearer 인증](https://docs.tosspayments.com/blog/everything-about-basic-bearer-auth.md)
- [시크릿 키 베스트 프랙티스](https://docs.tosspayments.com/blog/secret-key-best-practice.md)

### 13.2 테스트
- [회원가입, 사업자번호 없이 결제 테스트하기](https://docs.tosspayments.com/blog/how-to-test-toss-payments.md)
