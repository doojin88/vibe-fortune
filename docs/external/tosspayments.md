# 토스페이먼츠 구독 결제 시스템 가이드

## 개요
토스페이먼츠 자동결제(빌링)를 사용한 구독형 서비스 구현 가이드

---

## 1. 자동결제(빌링)란?

### 1.1 개념
**자동결제(빌링)**는 고객이 최초 1회 결제 정보를 등록하면, 이후 별도 인증 없이 자동으로 결제되는 방식입니다.

**⚠️ 중요**:
- 자동결제 API는 토스페이먼츠와 **추가 계약이 필요한 기능**입니다. 사용 전 반드시 계약을 완료해야 합니다.
- **정기 구독형 서비스가 아니라면 정책적으로 자동결제 사용이 제한**되니 유의하세요.
- 문의: 토스페이먼츠 고객센터(1544-7772, support@tosspayments.com)

### 1.2 지원 결제 수단

토스페이먼츠는 현재 **신용·체크카드 자동결제만 지원**합니다. 구매자의 카드 번호, 유효기간과 카드 소유자의 생년월일 또는 사업자번호가 필요합니다.

**지원하지 않는 결제 수단**:
- 간편결제: 토스페이, 카카오페이, 네이버페이 등 국내 간편결제 미지원
- 해외 간편결제: PayPal(페이팔) 등 미지원

### 1.3 사용 케이스
- 구독형 서비스 (OTT, 음악 스트리밍)
- 정기 배송
- 월간 멤버십
- 정기 기부금
- 월간 구독 서비스

### 1.4 핵심 개념

| 용어 | 설명 |
|------|------|
| **빌링키 (Billing Key)** | 고객의 카드 정보를 암호화하여 저장한 토큰 |
| **Customer Key** | 고객을 식별하는 고유 키 (⚠️ **UUID 등 추정 불가능한 값** 사용 필수) |
| **정기 결제** | 빌링키를 사용하여 주기적으로 자동 결제 |

---

## 2. 구독 서비스 구축 방법

### 2.1 직접 구축 필요
구독 서비스는 **API를 사용해서 직접 구축**해야 합니다. 1달 주기로 결제가 필요한 상품이면 1달마다 `customerKey`, 빌링키, 금액을 설정해서 카드 자동결제 승인 API를 호출하면 됩니다.

### 2.2 구독 취소/변경 처리
- **구독 취소**: 다음 결제일에 구독을 취소한 구매자의 빌링키, `customerKey`로 카드 자동결제 승인 API를 호출하지 않으면 됩니다.
- **금액 변경**: 카드 자동결제 승인 API를 호출할 때 `amount` 파라미터를 변경된 결제 금액으로 설정하면 됩니다.
- **주기 변경**: 카드 자동결제 승인 API를 호출하는 주기를 변경해주세요.

### 2.3 모바일 연동
자동결제(빌링)는 JavaScript SDK 뿐만 아니라, React Native와 Flutter를 위한 공식 SDK를 제공하여 모바일 환경에 쉽게 연동할 수 있습니다.

- **JavaScript SDK**: 웹 기반 환경(웹뷰 포함)에서 사용합니다.
- **React Native SDK**: `@tosspayments/widget-sdk-react-native` 패키지를 통해 네이티브 성능으로 연동합니다.
- **Flutter SDK**: `tosspayments_widget_sdk_flutter` 패키지를 통해 네이티브 성능으로 연동합니다.

### 2.4 빌링키 관리
- **빌링키 조회 API**: 발급된 빌링키를 조회하는 API는 제공되지 않습니다. 빌링키 발급 이후 반드시 안전하게 저장하세요.
- **빌링키 분실**: 빌링키를 잃어버렸다면 구매자에게 다시 결제 정보를 받아서 같은 카드에 새로운 빌링키를 발급받아주세요.
- **중복 발급**: 카드 하나에 여러 개의 빌링키를 중복으로 발급할 수 있어요. 빌링키 중복 발급을 방지하는 방법은 없습니다.
- **카드 재발급/만료**: 새로운 카드 정보로 빌링키를 다시 발급받으세요. 빌링키를 갱신하는 별도 과정은 없습니다.

---

## 3. 구독 결제 플로우

### 3.1 전체 흐름

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

## 4. 1단계: 빌링키 발급

### 4.1 클라이언트 (빌링키 발급 요청)

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

### 4.2 사용자 동작
1. 토스페이먼츠 결제창 표시
2. 카드 정보 입력 (카드 번호, 유효기간, CVC)
3. 카드사 인증 (간편 비밀번호 또는 SMS)

### 4.3 서버 (빌링키 승인)

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

## 5. 2단계: 최초 결제

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

## 6. 3단계: 정기 결제 (스케줄링)

### 6.1 Supabase Cron 설정

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

### 6.2 정기 결제 API 구현

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

### 6.3 결제 처리 로직

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

## 7. 4단계: 구독 관리

### 7.1 구독 취소

```typescript
// 사용자가 취소 신청
// - subscriptions.status = 'cancellation_pending'
// - 다음 결제일까지 Pro 혜택 유지
```

**취소 예정 상태 처리** (Cron에서):

```typescript
async function handleCancellation(subscription) {
  // 1. 토스페이먼츠 빌링키 삭제 API 호출
  await fetch(
    `https://api.tosspayments.com/v1/billing-key/remove`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingKey: subscription.billing_key,
      }),
    }
  );

  // 2. 구독 상태 변경
  await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('id', subscription.id);

  // 3. Pro 상태 해제
  await supabase
    .from('users')
    .update({ is_pro: false })
    .eq('clerk_user_id', subscription.customer_key);

  // ✅ 중요: 빌링키 삭제 API를 호출하여 고객의 결제 정보를 안전하게 제거합니다.
  // - 재구독 시 새로운 빌링키 발급이 필요합니다.
}
```

### 7.2 취소 철회

```typescript
// 취소 예정 상태에서 철회
// - subscriptions.status = 'active'
// - 다음 결제일에 정상 결제 진행
```

---

## 8. 인증 방식 (Basic Auth)

### 8.1 시크릿 키 인코딩

토스페이먼츠 API는 **Basic 인증** 방식을 사용합니다.

```typescript
const authorization = 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
```

**중요**:
- 시크릿 키 뒤에 콜론(`:`) 추가
- Base64로 인코딩
- 절대 클라이언트에 노출 금지

### 8.2 환경별 키

| 환경 | 키 접두어 | 용도 | 특징 |
|------|----------|------|------|
| 테스트 | `test_ck_...`, `test_sk_...` | 개발 및 테스트 | 실제 결제 없음, 무제한 테스트 가능 |
| 라이브 | `live_ck_...`, `live_sk_...` | 실제 운영 환경 | 실제 결제 발생, 수수료 발생 |

### 8.3 키 관리 베스트 프랙티스

**환경별 키 분리**:
```bash
# 개발 환경
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# 운영 환경
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...
```

**보안 체크리스트**:
- ✅ 시크릿 키는 서버 환경 변수에만 저장
- ✅ 클라이언트 코드에 시크릿 키 노출 금지
- ✅ Git 저장소에 시크릿 키 커밋 금지
- ✅ 환경별 키 분리 관리
- ✅ 정기적인 키 로테이션 (권장)

---

## 9. 구독 상태 관리

### 9.1 구독 상태

| 상태 | 코드 | 설명 | 다음 액션 |
|------|------|------|-----------|
| 활성 | `active` | 정상 구독 중 | 결제일에 자동 결제 |
| 취소 예정 | `cancellation_pending` | 다음 결제일까지 유효 | 결제일에 해지 처리 |
| 만료 | `expired` | 해지 완료 | 재구독 시 빌링키 재발급 |
| 실패 | `failed` | 결제 실패로 해지 | 재구독 시 빌링키 재발급 |

### 9.2 상태 전이

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

## 10. 주요 API 엔드포인트

### 10.1 빌링키 관련

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| `POST` | `/v1/billing/authorizations/issue` | 빌링키 발급 승인 (SDK 방식) |
| `POST` | `/v1/billing/authorizations/card` | 빌링키 직접 발급 (API 방식) |
| `POST` | `/v1/billing-key/remove` | 빌링키 삭제 (카드/계좌 공통) |

**✅ 중요**: 
- 이제 카드 자동결제도 빌링키 삭제 API를 공식적으로 지원합니다.
- 구독 해지 시 `POST /v1/billing-key/remove`를 호출하여 사용자 정보를 안전하게 제거하는 것이 좋습니다.

### 10.2 결제 관련

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| `POST` | `/v1/billing/{billingKey}` | 빌링키로 결제 (Idempotency-Key 필수 권장) |
| `POST` | `/v1/payments/{paymentKey}/cancel` | 결제 취소 |

### 10.3 웹훅 관련

| 이벤트 타입 | 설명 | 처리 방법 |
|-------------|------|-----------|
| `BILLING_DELETED` | 빌링키 삭제 알림 | 구독 상태를 'expired'로 변경 |
| `PAYMENT_STATUS_CHANGED` | 결제 상태 변경 | 결제 결과에 따른 구독 상태 업데이트 |

### 10.4 API 버전별 차이점

| 기능 | v1 API | v2 API | 비고 |
|------|--------|--------|------|
| 빌링키 발급 | `/v1/billing/authorizations/issue` | `/v1/billing/authorizations/card` | v2는 직접 발급 |
| 퀵계좌이체 | 지원 | 지원 | v2에서 새로 추가 |
| 빌링키 삭제 | 지원 | 지원 | 카드, 계좌 모두 삭제 가능 |
| 웹훅 | 기본 지원 | 확장 지원 | v2에서 더 많은 이벤트 |

**권장사항**: 최신 API 버전(v2) 사용을 권장하며, 개발자센터에서 API 버전을 확인할 수 있습니다.

---

## 11. 퀵계좌이체 자동결제 (선택사항)

### 11.1 퀵계좌이체 자동결제란?

**퀵계좌이체 자동결제**는 구매자가 계좌를 한 번만 등록하면, 별도의 본인인증 없이 간편하게 정기 결제를 진행할 수 있는 방식입니다.

**특징**:
- 계좌 등록 후 자동결제 가능
- 빌링키 삭제 API 지원 (카드 자동결제와 차이점)
- `BILLING_DELETED` 웹훅으로 실시간 해지 알림

### 11.2 퀵계좌이체 빌링키 발급

**클라이언트 (계좌 등록 요청)**:

```html
<script src="https://js.tosspayments.com/v2"></script>
<script>
  const tossPayments = TossPayments('YOUR_CLIENT_KEY');
  const payment = tossPayments.payment();

  // 퀵계좌이체 빌링키 발급 요청
  payment.requestBillingAuth({
    method: "TRANSFER", // 퀵계좌이체
    customerKey: crypto.randomUUID(),
    successUrl: window.location.origin + '/subscription/success',
    failUrl: window.location.origin + '/subscription/fail',
    customerEmail: 'user@example.com',
    customerName: '홍길동',
  });
</script>
```

**서버 (빌링키 발급 승인)**:

```typescript
// successUrl로 리다이렉트 후 처리
const response = await fetch(
  'https://api.tosspayments.com/v1/billing/authorizations/issue',
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
```

### 11.3 빌링키 삭제

카드, 퀵계좌이체 모두 빌링키 삭제가 가능하며, 동일한 API 엔드포인트를 사용합니다.

**빌링키 삭제 API**:

```typescript
// POST /v1/billing-key/remove
const response = await fetch(
  `https://api.tosspayments.com/v1/billing-key/remove`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      billingKey: billingKey
    }),
  }
);
```

구독 해지 시 이 API를 호출하는 로직은 **7.1 구독 취소** 섹션을 참고하세요.

**BILLING_DELETED 웹훅 처리**:

```typescript
// POST /api/webhooks/toss
export async function POST(req: Request) {
  const webhook = await req.json();
  
  if (webhook.eventType === 'BILLING_DELETED') {
    const { billingKey } = webhook.data;
    
    // 구독 상태를 'expired'로 변경
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('billing_key', billingKey);
  }
  
  return Response.json({ success: true });
}
```

---

## 12. 웹훅 처리

### 12.1 웹훅 설정

**개발자센터에서 웹훅 등록**:
1. 개발자센터 > 웹훅 메뉴 접속
2. `BILLING_DELETED`, `PAYMENT_STATUS_CHANGED` 이벤트 선택
3. 웹훅 수신 엔드포인트 URL 등록

### 12.1.1 웹훅 보안 검증

**웹훅 서명 검증** (권장):

```typescript
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-toss-signature');
  
  // 웹훅 서명 검증
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const webhook = JSON.parse(body);
  // 웹훅 처리 로직...
}
```

**중요**: 웹훅 서명 검증을 통해 악의적인 요청을 차단하세요.

### 12.2 BILLING_DELETED 웹훅 처리

**빌링키 삭제 시 수신되는 웹훅**:

```json
{
  "eventType": "BILLING_DELETED",
  "createdAt": "2024-12-01T00:00:00.000000",
  "data": {
    "billingKey": "wm60xF900HXZRzReBluSSgJriVX7d7rS0oyslw4zRwg"
  }
}
```

**처리 로직**:

```typescript
// POST /api/webhooks/toss
export async function POST(req: Request) {
  const webhook = await req.json();
  
  if (webhook.eventType === 'BILLING_DELETED') {
    const { billingKey } = webhook.data;
    
    // 1. 해당 빌링키의 구독 상태를 'expired'로 변경
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('billing_key', billingKey);
    
    // 2. 사용자의 Pro 상태 해제
    await supabase
      .from('users')
      .update({ is_pro: false })
      .eq('customer_key', subscription.customer_key);
    
    // 3. 사용자에게 알림 발송
    await sendNotification({
      type: 'billing_deleted',
      message: '결제 정보가 삭제되어 구독이 해지되었습니다.'
    });
  }
  
  return Response.json({ success: true });
}
```

### 12.3 PAYMENT_STATUS_CHANGED 웹훅 처리

**결제 상태 변경 시 수신되는 웹훅**:

```json
{
  "eventType": "PAYMENT_STATUS_CHANGED",
  "createdAt": "2022-01-01T00:00:00.000000",
  "data": {
    "paymentKey": "payment_key_123",
    "orderId": "order_123",
    "status": "DONE",
    "approvedAt": "2022-01-01T00:00:00+09:00"
  }
}
```

**처리 로직**:

```typescript
if (webhook.eventType === 'PAYMENT_STATUS_CHANGED') {
  const { paymentKey, orderId, status } = webhook.data;
  
  if (status === 'DONE') {
    // 결제 성공 처리
    await handlePaymentSuccess(paymentKey, orderId);
  } else if (status === 'ABORTED') {
    // 결제 실패 처리
    await handlePaymentFailure(paymentKey, orderId);
  }
}
```

---

## 13. 에러 처리 및 해결방법

### 13.1 주요 에러 코드

| 에러 코드 | 설명 | 해결 방법 |
|-----------|------|-----------|
| `UNAUTHORIZED_KEY` | API 키 오류 | 클라이언트 키와 시크릿 키 매칭 확인 |
| `NOT_SUPPORTED_METHOD` | 자동결제 계약 미완료 | 토스페이먼츠 고객센터 문의 |
| `NOT_MATCHES_CUSTOMER_KEY` | customerKey 불일치 | customerKey와 billingKey 매칭 확인 |
| `PAY_PROCESS_CANCELED` | 사용자 취소 | 사용자에게 취소 확인 메시지 표시 |
| `PAY_PROCESS_ABORTED` | 결제 실패 | 결제 정보 재확인 요청 |
| `REJECT_CARD_COMPANY` | 카드사 거절 | 카드 정보 또는 한도 확인 |

### 13.2 에러 처리 구현

```typescript
async function handlePaymentError(error: any) {
  switch (error.code) {
    case 'UNAUTHORIZED_KEY':
      console.error('API 키 오류:', error.message);
      // 관리자에게 알림 발송
      break;
      
    case 'NOT_SUPPORTED_METHOD':
      console.error('자동결제 계약 필요:', error.message);
      // 토스페이먼츠 고객센터 연락 안내
      break;
      
    case 'NOT_MATCHES_CUSTOMER_KEY':
      console.error('CustomerKey 불일치:', error.message);
      // 빌링키 재발급 프로세스 안내
      break;
      
    case 'PAY_PROCESS_CANCELED':
      // 사용자 취소 - 정상적인 케이스
      break;
      
    case 'PAY_PROCESS_ABORTED':
      console.error('결제 실패:', error.message);
      // 사용자에게 결제 정보 확인 요청
      break;
      
    case 'REJECT_CARD_COMPANY':
      console.error('카드사 거절:', error.message);
      // 카드 정보 또는 한도 확인 안내
      break;
      
    default:
      console.error('알 수 없는 에러:', error);
      // 일반적인 에러 처리
  }
}
```

---

## 14. 환경 변수

```bash
# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...  # 클라이언트용 (SDK 초기화)
TOSS_SECRET_KEY=test_sk_...              # 서버용 (API 호출)

# 웹훅 보안
WEBHOOK_SECRET=your_webhook_secret       # 웹훅 서명 검증용

# Supabase Cron
SUPABASE_CRON_REQUEST_SECRET=your_cron_secret  # Cron 요청 인증용
```

---

## 15. 필수 패키지

```bash
npm install @tosspayments/tosspayments-sdk
```

---

## 16. 주의사항 및 베스트 프랙티스

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

7. **구독 취소 처리**
   - ✅ 구독 해지 시에는 **빌링키 삭제 API를 호출**하여 고객의 결제 정보를 안전하게 제거합니다.
   - 결제 실패 시에는 빌링키를 바로 삭제하기보다, 유저에게 알리고 재결제를 유도한 뒤 특정 횟수 이상 실패 시 삭제하는 정책을 고려할 수 있습니다.

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

## 17. 참고 자료

### 17.1 공식 문서
- [자동결제(빌링) 이해하기](https://docs.tosspayments.com/guides/v2/billing.md)
- [자동결제(빌링) 결제창 연동하기](https://docs.tosspayments.com/guides/v2/billing/integration.md)
- [구독 결제 서비스 구현하기 (1) 빌링키 발급](https://docs.tosspayments.com/blog/subscription-service-1.md)
- [구독 결제 서비스 구현하기 (2) 스케줄링](https://docs.tosspayments.com/blog/subscription-service-2.md)
- [Basic 인증과 Bearer 인증](https://docs.tosspayments.com/blog/everything-about-basic-bearer-auth.md)
- [시크릿 키 베스트 프랙티스](https://docs.tosspayments.com/blog/secret-key-best-practice.md)

### 17.2 테스트
- [회원가입, 사업자번호 없이 결제 테스트하기](https://docs.tosspayments.com/blog/how-to-test-toss-payments.md)
