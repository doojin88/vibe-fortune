# 요구사항 정의서 (Requirement Document)

## 1. 프로젝트 개요

### 1.1 목적
Clerk, Supabase, 토스페이먼츠를 연동한 구독형 사주 분석 서비스 구현

### 1.2 핵심 가치
- Clerk 로그인 기반 사용자 인증
- 무료/유료 구독 모델을 통한 차등화된 서비스 제공
- Gemini AI 기반 사주팔자 분석
- 자동 정기 결제 시스템

---

## 2. 기술 스택

| 구분 | 기술 | 역할 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | 풀스택 웹 애플리케이션 |
| 인증 | Clerk | 로그인, 세션 관리, Webhook |
| 데이터베이스 | Supabase (PostgreSQL) | 데이터 저장, Cron Jobs |
| 결제 | 토스페이먼츠 | 빌링키 발급, 정기 결제 |
| AI 분석 | Google Gemini API | 사주 분석 (`gemini-2.5-flash`, `gemini-2.5-pro`) |

---

## 3. 기능 요구사항

### 3.1 사용자 인증 (Clerk)

#### 3.1.0 Clerk SDK 설정
**필수 패키지**:
```bash
npm install @clerk/nextjs@latest
```

**주요 문서**:
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk 로그인 연동 가이드](https://clerk.com/docs/quickstarts/nextjs)

#### 3.1.1 Clerk 미들웨어 설정
**파일**: `middleware.ts` (프로젝트 루트 또는 `src/` 디렉토리)

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Next.js 내부 파일과 정적 파일 제외
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API 라우트는 항상 실행
    '/(api|trpc)(.*)',
  ],
};
```

**중요 사항**:
- ❌ **사용 금지**: `authMiddleware()` (구버전, 더 이상 사용 안 함)
- ✅ **사용**: `clerkMiddleware()` (현재 버전)

#### 3.1.2 ClerkProvider 래퍼 설정
**파일**: `app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

#### 3.1.3 Clerk 로그인 UI 구현
Clerk SDK 기본 컴포넌트 사용:

```typescript
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}
```

**Clerk Dashboard 설정**:
1. [Clerk Dashboard](https://dashboard.clerk.com/) 로그인
2. Application 선택 > **User & Authentication** > **Social Connections**
3. 원하는 소셜 로그인 방식 활성화
4. 자동 생성된 키 사용 또는 커스텀 OAuth 앱 연결

#### 3.1.4 서버에서 사용자 정보 접근
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';

// 방법 1: auth() - userId만 필요할 때
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}

// 방법 2: currentUser() - 전체 사용자 정보 필요할 때
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  console.log(user.emailAddresses[0].emailAddress);
  // ...
}
```

**중요 사항**:
- `auth()`, `currentUser()`는 반드시 `async/await`와 함께 사용
- `@clerk/nextjs/server`에서 import (서버 전용)
- `@clerk/nextjs`에서 import하는 것은 클라이언트 컴포넌트용

#### 3.1.5 Clerk Webhook 연동
**목적**: Clerk에서 발생한 사용자 이벤트를 Supabase에 동기화

**1. Webhook 엔드포인트 생성**
**파일**: `app/api/webhooks/clerk/route.ts`

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) throw new Error('CLERK_WEBHOOK_SECRET not set');

  // 요청 헤더 및 바디 가져오기
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: 'Missing headers' }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhook 서명 검증
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  // 이벤트 타입에 따른 처리
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    // Supabase에 사용자 생성
    await createUserInSupabase({
      clerk_user_id: id,
      email: email_addresses[0].email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      profile_image_url: image_url,
    });
  }

  if (eventType === 'user.updated') {
    // Supabase 사용자 업데이트
  }

  if (eventType === 'user.deleted') {
    // Supabase 사용자 삭제
  }

  return Response.json({ received: true }, { status: 200 });
}
```

**2. Clerk Dashboard에서 Webhook 설정**
1. **배포 완료 후** 공개 URL 확보 (예: `https://yourdomain.com`)
2. [Clerk Dashboard](https://dashboard.clerk.com/) > **Webhooks**
3. **Add Endpoint** 클릭
4. Endpoint URL: `https://yourdomain.com/api/webhooks/clerk`
5. 이벤트 선택:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. **Signing Secret** 복사 → `.env`에 `CLERK_WEBHOOK_SECRET` 저장

**중요 사항**:
- ⚠️ Webhook은 **배포 환경에서만** 테스트 가능 (로컬 개발 시 ngrok 등 필요)
- `svix` 패키지로 서명 검증 필수
- Webhook 실패 시 Clerk가 자동 재시도

---

### 3.2 페이지 구성 및 접근 제어

| 페이지 | 경로 | 인증 필요 | 설명 |
|--------|------|-----------|------|
| 홈 (랜딩) | `/` | ❌ | 서비스 소개, 로그인/회원가입 CTA |
| 대시보드 | `/dashboard` | ✅ | 사용자의 분석 목록 |
| 새 분석하기 | `/analysis/new` | ✅ | 사주 정보 입력 폼 |
| 분석 상세보기 | `/analysis/[id]` | ✅ | 분석 결과 마크다운 렌더링 |
| 구독 관리 | `/subscription` | ✅ | 구독 상태 확인, 결제/취소 |

**접근 제어 규칙:**
- 홈 페이지 외 모든 페이지는 인증 필수
- Clerk 미들웨어/컴포넌트로 보호

---

### 3.3 사주 분석 기능 (Gemini API)

#### 3.3.1 무료 사용자
- **테스트 횟수:** 최초 3회
- **사용 모델:** `gemini-2.5-flash`
- 회원가입 시 자동 부여

#### 3.3.2 Pro 구독 사용자
- **테스트 횟수:** 월 10회 (매 결제일 갱신)
- **사용 모델:** `gemini-2.5-pro`
- 구독 활성화 시 즉시 적용

#### 3.3.3 분석 프로세스
1. 사용자 입력: 성함, 생년월일, 출생시간, 성별
2. 잔여 테스트 횟수 확인 (Supabase)
3. Gemini API 호출 (사용자 등급에 따른 모델 선택)
4. 분석 결과 Supabase 저장 및 테스트 횟수 차감
5. 마크다운 형식 결과 반환

#### 3.3.4 프롬프트 구조
```typescript
// 예시 시스템 프롬프트
당신은 20년 경력의 전문 사주팔자 상담사입니다.

**입력 정보**:
- 성함: {name}
- 생년월일: {birthDate}
- 출생시간: {birthTime || '미상'}
- 성별: {gender === 'male' ? '남성' : '여성'}

**분석 요구사항**:
- 천간(天干)과 지지(地支) 계산
- 오행(五行) 분석 (목, 화, 토, 금, 수)
- 대운(大運)과 세운(歲運) 해석
- 전반적인 성격, 재운, 건강운, 연애운 분석

**출력 형식**: 마크다운

**금지 사항**:
- 의료·법률 조언
- 확정적 미래 예측
- 부정적·공격적 표현
```

---

### 3.4 구독 결제 시스템 (토스페이먼츠)

#### 3.4.0 사용 SDK 및 API
- **SDK**: 토스페이먼츠 JavaScript SDK (자동결제/빌링)
- **주요 문서**:
  - [자동결제(빌링) 이해하기](https://docs.tosspayments.com/guides/v2/billing.md)
  - [자동결제(빌링) 결제창 연동하기](https://docs.tosspayments.com/guides/v2/billing/integration.md)
  - [구독 결제 서비스 구현하기 (1) 빌링키 발급](https://docs.tosspayments.com/blog/subscription-service-1.md)
  - [구독 결제 서비스 구현하기 (2) 스케줄링](https://docs.tosspayments.com/blog/subscription-service-2.md)

#### 3.4.1 구독 가입 플로우 (빌링키 발급)
**1. 클라이언트: 빌링키 발급 요청**
```javascript
// 토스페이먼츠 JavaScript SDK 로드
const tossPayments = TossPayments('CLIENT_KEY');

// 빌링키 발급 위젯 요청
tossPayments.requestBillingAuth('카드', {
  customerKey: 'clerk_user_id',  // Clerk 사용자 ID
  successUrl: window.location.origin + '/subscription/success',
  failUrl: window.location.origin + '/subscription/fail',
});
```

**2. 사용자: 결제 수단 입력 및 인증**
- 토스페이먼츠 결제창에서 카드 정보 입력
- 카드사 인증 (간편 비밀번호, SMS 등)

**3. 서버: successUrl 리다이렉트 후 빌링키 발급 승인**
```javascript
// POST /api/subscription/billing-key
// Query params: authKey, customerKey

// 토스페이먼츠 API 호출 (서버 to 서버)
POST https://api.tosspayments.com/v1/billing/authorizations/{authKey}
Headers:
  Authorization: Basic {TOSS_SECRET_KEY를 Base64 인코딩}
  Content-Type: application/json
Body:
  {
    "customerKey": "clerk_user_id"
  }

// 응답에서 billingKey 획득
```

**4. 서버: 최초 결제 즉시 실행**
```javascript
// 빌링키로 즉시 결제 요청
POST https://api.tosspayments.com/v1/billing/{billingKey}
Headers:
  Authorization: Basic {TOSS_SECRET_KEY를 Base64 인코딩}
  Content-Type: application/json
Body:
  {
    "customerKey": "clerk_user_id",
    "amount": 9900,
    "orderId": "order_uuid",
    "orderName": "사주 분석 Pro 구독 (첫 결제)",
    "customerEmail": "user@example.com",
    "customerName": "홍길동"
  }
```

**5. 서버: Supabase 데이터 저장**
- `subscriptions` 테이블에 구독 정보 저장
  - `billing_key`: 발급받은 빌링키
  - `customer_key`: `clerk_user_id`
  - `status`: `'active'`
  - `next_payment_date`: `현재 날짜 + 1개월`
  - `last_payment_date`: `현재 날짜`
- `users` 테이블 업데이트
  - `is_pro`: `true`
  - `test_count`: `+10`
- `payment_history` 테이블에 결제 기록 추가

#### 3.4.2 구독 상태 관리

| 상태 | 코드 | 설명 |
|------|------|------|
| 활성 | `active` | 정상 구독 중, 다음 결제일에 자동 결제 |
| 취소 예정 | `cancellation_pending` | 사용자가 취소했으나 다음 결제일까지 유효 |
| 만료 | `expired` | 결제일 도래 후 해지 완료 |
| 실패 | `failed` | 결제 실패로 인한 자동 해지 |

#### 3.4.3 구독 취소 정책
1. **취소 신청:**
   - 구독 관리 페이지에서 "구독 취소" 버튼 클릭
   - 상태가 `active` → `cancellation_pending`으로 변경
   - 다음 결제일까지 Pro 혜택 유지

2. **취소 철회:**
   - `cancellation_pending` 상태에서 "취소 철회" 가능
   - 상태가 `cancellation_pending` → `active`로 변경
   - 다음 결제일에 정상 결제 진행

3. **해지 완료:**
   - 다음 결제일 도래 시 자동으로 `expired` 상태로 변경
   - 토스페이먼츠 API를 통해 빌링키 삭제
   - 사용자 Pro 상태 회수

---

### 3.5 자동 정기 결제 시스템 (Supabase Cron)

#### 3.5.1 Cron Job 설정
```sql
-- Supabase SQL Editor에서 실행
SELECT cron.schedule(
  'daily-subscription-billing',
  '0 2 * * *',  -- 매일 02:00 KST
  $$
  SELECT net.http_post(
    url := 'https://yourdomain.com/api/cron/process-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

#### 3.5.2 정기 결제 API 플로우
**엔드포인트:** `POST /api/cron/process-subscriptions`

**1. 요청 검증**
- `Authorization` 헤더에서 Cron Secret 확인
- 유효하지 않으면 `401 Unauthorized` 반환

**2. 결제 대상 구독 조회**
```sql
SELECT * FROM subscriptions
WHERE next_payment_date = CURRENT_DATE
  AND status IN ('active', 'cancellation_pending')
```

**3. 각 구독 건 처리**

**Case A: 취소 예정 건 (`cancellation_pending`)**
```javascript
// 1. 구독 상태를 'expired'로 변경
UPDATE subscriptions SET status = 'expired' WHERE id = {subscription_id};

// 2. 토스페이먼츠 빌링키 삭제 API 호출
DELETE https://api.tosspayments.com/v1/billing/authorizations/{billingKey}
Headers:
  Authorization: Basic {TOSS_SECRET_KEY를 Base64 인코딩}

// 3. users 테이블에서 is_pro = false 설정
UPDATE users SET is_pro = false WHERE id = {user_id};

// 4. (선택) test_count 초기화하지 않음 (남은 횟수는 유지)
```

**Case B: 활성 구독 건 (`active`)**
```javascript
// 1. 토스페이먼츠 빌링키 결제 API 호출
POST https://api.tosspayments.com/v1/billing/{billingKey}
Headers:
  Authorization: Basic {TOSS_SECRET_KEY를 Base64 인코딩}
  Content-Type: application/json
Body:
  {
    "customerKey": "clerk_user_id",
    "amount": 9900,
    "orderId": "subscription_renewal_uuid",
    "orderName": "사주 분석 Pro 구독 (정기결제)",
    "customerEmail": "user@example.com",
    "customerName": "홍길동"
  }

// 2-A. 결제 성공 (HTTP 200)
UPDATE users SET test_count = test_count + 10 WHERE id = {user_id};
UPDATE subscriptions SET
  next_payment_date = next_payment_date + INTERVAL '1 month',
  last_payment_date = CURRENT_DATE
WHERE id = {subscription_id};
INSERT INTO payment_history (subscription_id, amount, status, payment_key)
VALUES ({subscription_id}, 9900, 'success', {paymentKey});

// 2-B. 결제 실패 (HTTP 4xx/5xx)
UPDATE subscriptions SET status = 'failed' WHERE id = {subscription_id};
DELETE https://api.tosspayments.com/v1/billing/authorizations/{billingKey}
  Headers: Authorization: Basic {TOSS_SECRET_KEY를 Base64 인코딩}
UPDATE users SET is_pro = false WHERE id = {user_id};
INSERT INTO payment_history (subscription_id, amount, status, error_message)
VALUES ({subscription_id}, 9900, 'failed', {error_message});
```

#### 3.5.3 재구독
- 해지(`expired`, `failed`) 후 재구독 시 빌링키 재발급 필수
- 토스페이먼츠 SDK로 새로운 빌링키 발급 프로세스 진행

---

## 4. 데이터베이스 스키마 (Supabase)

### 4.1 users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  profile_image_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  test_count INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 subscriptions 테이블
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  billing_key TEXT NOT NULL,
  customer_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancellation_pending', 'expired', 'failed')),
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 analyses 테이블
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  model_used TEXT NOT NULL,
  result_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 payment_history 테이블
```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  payment_key TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API 엔드포인트 설계

### 5.1 인증 관련
- `POST /api/webhooks/clerk` - Clerk 웹훅 수신

### 5.2 분석 관련
- `POST /api/analysis` - 새 분석 생성
- `GET /api/analysis` - 사용자 분석 목록 조회
- `GET /api/analysis/[id]` - 분석 상세 조회

### 5.3 구독 관련
- `GET /api/subscription` - 현재 구독 상태 조회
- `POST /api/subscription/billing-key` - 빌링키 발급 후 구독 생성
- `POST /api/subscription/cancel` - 구독 취소 신청
- `POST /api/subscription/reactivate` - 취소 철회
- `POST /api/cron/process-subscriptions` - 정기 결제 처리 (Cron 전용)

---

## 6. 환경 변수

### 6.0 필수 패키지
```bash
# Clerk
npm install @clerk/nextjs@latest svix

# 토스페이먼츠
npm install @tosspayments/tosspayments-sdk

# Gemini AI
npm install @google/generative-ai
```

### 6.1 환경 변수 설정
```bash
# Clerk (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # 클라이언트용 공개 키
CLERK_SECRET_KEY=sk_test_...                   # 서버용 비밀 키
CLERK_WEBHOOK_SECRET=whsec_...                 # Webhook 서명 검증용 (배포 후 설정)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...          # 클라이언트용 익명 키
SUPABASE_SERVICE_ROLE_KEY=eyJh...              # 서버용 service_role 키 (절대 클라이언트 노출 금지)

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...        # 클라이언트용 키 (SDK 초기화)
TOSS_SECRET_KEY=test_sk_...                    # 서버용 시크릿 키 (API 호출)

# Gemini API
GEMINI_API_KEY=AIza...                         # Gemini API 키

# Cron 보안
CRON_SECRET=your-strong-random-secret-here     # Supabase Cron 요청 검증용
```

### 6.2 토스페이먼츠 API 인증 방식
토스페이먼츠 API는 **Basic 인증** 방식을 사용합니다.

```javascript
// Node.js 예시
const authorization = 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');

fetch('https://api.tosspayments.com/v1/billing/{billingKey}', {
  method: 'POST',
  headers: {
    'Authorization': authorization,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ /* ... */ })
});
```

**중요 사항**:
- 시크릿 키 뒤에 콜론(`:`)을 붙이고 Base64로 인코딩
- 시크릿 키는 **절대 클라이언트 코드에 노출하지 않음**
- 테스트 환경: `test_sk_...` / 라이브 환경: `live_sk_...`

### 6.3 환경별 키 구분
| 환경 | 키 접두어 | 용도 |
|------|----------|------|
| 테스트 | `test_ck_...`, `test_sk_...` | 개발 및 테스트 |
| 라이브 | `live_ck_...`, `live_sk_...` | 실제 운영 환경 |

---

## 7. 통과 조건 체크리스트

### 7.1 필수 연동
- [ ] Clerk SDK 연동 (로그인)
- [ ] Clerk Webhook 구현 (사용자 동기화)
- [ ] 토스페이먼츠 SDK 연동 (빌링키 발급)
- [ ] 토스페이먼츠 API 연동 (정기 결제, 빌링키 삭제)
- [ ] Gemini API 연동 (flash/pro 모델 분기)
- [ ] Supabase 데이터베이스 구성
- [ ] Supabase Cron Jobs 설정

### 7.2 필수 페이지
- [ ] 홈 (랜딩페이지) - 인증 불필요
- [ ] 대시보드 (분석 목록) - 인증 필요
- [ ] 새 분석하기 - 인증 필요
- [ ] 분석 상세보기 - 인증 필요
- [ ] 구독 관리 - 인증 필요

### 7.3 구독 정책
- [ ] 무료 사용자: 최초 3회, `gemini-2.5-flash` 사용
- [ ] Pro 구독자: 월 10회, `gemini-2.5-pro` 사용
- [ ] 구독 취소 시 다음 결제일까지 상태 유지
- [ ] 취소 예정 상태에서 철회 가능
- [ ] 해지 시 빌링키 자동 삭제
- [ ] 재구독 시 빌링키 재발급 필요

### 7.4 자동 결제
- [ ] Supabase Cron으로 매일 02:00 API 호출
- [ ] Cron Secret으로 요청 검증
- [ ] 결제일 도래 구독 건 자동 탐색
- [ ] 결제 성공 시 테스트 횟수 +10, 구독 기간 연장
- [ ] 결제 실패 시 즉시 해지 및 빌링키 삭제

---

## 8. 배포 고려사항

### 8.1 Clerk Webhook
- Vercel/AWS 등 배포 후 공개 URL 확보
- Clerk Dashboard에서 Webhook Endpoint 등록
- `user.created`, `user.updated`, `user.deleted` 이벤트 활성화

### 8.2 Supabase Cron
- Supabase SQL Editor에서 Cron Job 생성
- Next.js API의 배포 URL을 Cron 대상으로 설정

### 8.3 보안
- 환경 변수 노출 방지 (서버 전용 키는 클라이언트로 전달 금지)
- Cron API 엔드포인트에 강력한 Secret 인증 적용
- 토스페이먼츠 Webhook 검증 (선택사항)

---

## 9. 평가 기준

### 9.1 필수 항목
1. **SDK 연동**: Clerk, 토스페이먼츠, Gemini API 오류 없이 작동
2. **요구사항 문서**: 본 문서의 명확성 및 완성도
3. **(가산점) 프롬프트/Agent 저장**: 구현 과정에서 사용한 프롬프트 문서화

### 9.2 비평가 항목
- 디자인 품질 (미리보기와 동일할 필요 없음)
- 추가 기능 구현 (명시되지 않은 기능)

---

## 10. 참고 자료

### 10.1 공식 문서
- [Clerk 공식 문서](https://clerk.com/docs)
- [토스페이먼츠 개발자 센터](https://docs.tosspayments.com/)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Supabase 문서](https://supabase.com/docs)

### 10.2 토스페이먼츠 핵심 가이드
**자동결제(빌링) 관련**:
- [자동결제(빌링) 이해하기](https://docs.tosspayments.com/guides/v2/billing.md)
- [자동결제(빌링) 결제창 연동하기](https://docs.tosspayments.com/guides/v2/billing/integration.md)
- [구독 결제 서비스 구현하기 (1) 빌링키 발급](https://docs.tosspayments.com/blog/subscription-service-1.md)
- [구독 결제 서비스 구현하기 (2) 스케줄링](https://docs.tosspayments.com/blog/subscription-service-2.md)

**API 및 인증**:
- [API 키 발급 및 사용](https://docs.tosspayments.com/reference/using-api/api-keys.md)
- [Basic 인증과 Bearer 인증](https://docs.tosspayments.com/blog/everything-about-basic-bearer-auth.md)
- [시크릿 키 베스트 프랙티스](https://docs.tosspayments.com/blog/secret-key-best-practice.md)
- [코어 API 레퍼런스](https://docs.tosspayments.com/reference.md)

**테스트 및 배포**:
- [회원가입, 사업자번호 없이 결제 테스트하기](https://docs.tosspayments.com/blog/how-to-test-toss-payments.md)
- [환경 설정하기](https://docs.tosspayments.com/guides/v2/get-started/environment.md)
- [배포 체크리스트](https://docs.tosspayments.com/guides/v2/deploy-checklist.md)

### 10.3 Clerk 핵심 가이드
**Quick Start**:
- [Clerk Next.js App Router Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk 로그인 연동 가이드](https://clerk.com/docs/quickstarts/nextjs)

**인증 및 사용자 관리**:
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Webhook 연동 가이드](https://clerk.com/docs/integrations/webhooks)
- [서버 사이드 인증](https://clerk.com/docs/references/nextjs/auth)
- [AI Prompts for Clerk](https://clerk.com/docs/guides/development/ai-prompts)

### 10.4 구현 힌트
**Clerk**:
- ✅ **반드시 사용**: `clerkMiddleware()` (최신 버전)
- ❌ **사용 금지**: `authMiddleware()` (구버전)
- Webhook은 배포 환경에서만 테스트 가능 (로컬은 ngrok 필요)
- `clerk_user_id`를 토스페이먼츠 `customerKey`로 사용
- `auth()`, `currentUser()`는 `@clerk/nextjs/server`에서 import
- `svix` 패키지로 Webhook 서명 검증 필수

**토스페이먼츠**:
- 빌링키 발급: `requestBillingAuth()` 메서드 사용
- 빌링키로 결제: `POST /v1/billing/{billingKey}` API 호출
- 빌링키 삭제: `DELETE /v1/billing/authorizations/{billingKey}` API 호출
- Basic 인증: `시크릿키:` (콜론 포함) Base64 인코딩
- 테스트 환경에서는 실제 결제 없이 시뮬레이션 가능
- `orderId`는 매 결제마다 고유해야 함 (UUID 권장)

**Supabase**:
- Cron 실행 로그: Supabase Dashboard > Database > Cron Jobs
- Cron 시간대: UTC 기준 (한국 시간 02:00 = UTC 17:00 전날)
- `net.http_post()` 함수로 외부 API 호출

**Gemini API**:
- Safety Settings 적절히 조정 (사주 콘텐츠 특성 고려)
- Rate Limit 확인 (무료: 분당 15회, 유료: 프로젝트별 상이)
- `gemini-2.5-flash` vs `gemini-2.5-pro`: 속도/품질 트레이드오프
