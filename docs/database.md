# 데이터베이스 설계 문서

## 개요

- **데이터베이스**: Supabase (PostgreSQL 15+)
- **인증**: Clerk (Webhook 동기화)
- **결제**: 토스페이먼츠 (빌링키 자동결제)
- **설계 원칙**: 유저플로우 기반, 오버엔지니어링 배제, 확장 가능

---

## 데이터 플로우

### 1. 회원가입
```
사용자 → Clerk (Google OAuth) → user.created Webhook
→ /api/webhooks/clerk → Supabase users INSERT
(초기: subscription_status='free', test_count=3)
```

### 2. 사주분석 생성
```
사용자 → 폼 입력 → Server Action
→ test_count 확인 (0이면 거부)
→ Gemini API (무료: flash, Pro: pro)
→ analyses INSERT + users.test_count 감소
→ 상세 페이지 리다이렉트
```

### 3. 구독 플로우 (무료 → Pro)
```
사용자 → Pro 구독하기 → 토스페이먼츠 SDK
→ 본인인증 → authKey → /api/subscription/confirm
→ 빌링키 발급 → subscriptions INSERT
→ 첫 결제 → payments INSERT
→ users 업데이트 (subscription_status='pro', test_count=10)
```

### 4. 구독 취소
```
사용자 → 구독 취소 → 확인
→ subscriptions.status='cancelled', users.subscription_status='cancelled'
→ 다음 결제일까지 Pro 혜택 유지
→ Cron (다음 결제일 도달) → 빌링키 삭제 → 해지
```

### 5. 정기 결제 (Cron)
```
Supabase Cron (매일 오전 2시) → /api/subscription/process
→ 오늘이 결제일인 활성 구독 조회
→ 자동결제 승인 API → 성공:
  - payments INSERT
  - users.test_count=10 재설정
  - subscriptions.next_billing_date +30일
→ 실패:
  - subscriptions.status='payment_failed'
  - 이메일 알림
```

---

## 테이블 정의

### users

**설명**: Clerk 사용자 정보 및 구독 상태

**Primary Key**: `id`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | Clerk user ID (예: `user_2xxx`) |
| email | text | NO | - | 사용자 이메일 (UNIQUE) |
| name | text | NO | - | 사용자 이름 |
| subscription_status | text | NO | 'free' | 구독 상태 (free/pro/cancelled/payment_failed) |
| test_count | integer | NO | 3 | 잔여 검사 횟수 |
| created_at | timestamptz | NO | NOW() | 가입일시 |
| updated_at | timestamptz | NO | NOW() | 정보 수정일시 |

```sql
CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  subscription_status text NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'pro', 'cancelled', 'payment_failed')),
  test_count integer NOT NULL DEFAULT 3 CHECK (test_count >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Clerk 사용자 정보 및 구독 상태';
COMMENT ON COLUMN users.id IS 'Clerk user ID (text 타입)';
COMMENT ON COLUMN users.subscription_status IS '구독 상태: free(초기 3회), pro(월 10회), cancelled(취소 예약), payment_failed(결제 실패)';
COMMENT ON COLUMN users.test_count IS '잔여 검사 횟수 (무료: 초기 3회만, Pro: 월 10회 갱신)';
```

---

### analyses

**설명**: 사주분석 데이터 및 AI 결과 저장

**Primary Key**: `id`

**Foreign Keys**: `user_id` → `users(id)`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | 분석 고유 ID |
| user_id | text | NO | - | 사용자 ID (외래키) |
| name | text | NO | - | 분석 대상 이름 |
| birth_date | date | NO | - | 생년월일 |
| birth_time | text | YES | NULL | 출생시간 (HH:mm 형식, 선택) |
| gender | text | NO | - | 성별 (male/female) |
| analysis_result | text | NO | - | AI 분석 결과 (마크다운) |
| model_used | text | NO | - | 사용 모델 (flash/pro) |
| created_at | timestamptz | NO | NOW() | 분석 생성일시 |

```sql
CREATE TABLE analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date NOT NULL,
  birth_time text CHECK (birth_time IS NULL OR birth_time ~ '^\d{2}:\d{2}$'),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  analysis_result text NOT NULL,
  model_used text NOT NULL CHECK (model_used IN ('flash', 'pro')),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE analyses IS '사주분석 데이터 및 AI 생성 결과';
COMMENT ON COLUMN analyses.birth_time IS '출생시간 (HH:mm 형식, 선택 항목). NULL이면 출생시간 모름';
COMMENT ON COLUMN analyses.model_used IS 'Gemini 모델: flash(무료), pro(Pro 구독자)';
```

---

### subscriptions

**설명**: Pro 구독 정보 및 빌링키 관리

**Primary Key**: `id`

**Foreign Keys**: `user_id` → `users(id)`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | 구독 고유 ID |
| user_id | text | NO | - | 사용자 ID (외래키, UNIQUE) |
| billing_key | text | NO | - | 토스페이먼츠 빌링키 |
| customer_key | text | NO | - | 토스페이먼츠 customerKey (UUID) |
| card_number | text | YES | NULL | 카드 번호 마지막 4자리 |
| card_type | text | YES | NULL | 카드 타입 (체크/신용) |
| card_company | text | YES | NULL | 카드사 이름 |
| status | text | NO | 'active' | 구독 상태 (active/cancelled/terminated/payment_failed) |
| next_billing_date | timestamptz | NO | - | 다음 결제일 |
| last_billing_date | timestamptz | YES | NULL | 마지막 결제 성공일 |
| billing_key_deleted_at | timestamptz | YES | NULL | 빌링키 삭제 일시 |
| created_at | timestamptz | NO | NOW() | 구독 시작일 |
| updated_at | timestamptz | NO | NOW() | 정보 수정일시 |

```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  billing_key text NOT NULL,
  customer_key text NOT NULL,
  card_number text CHECK (card_number IS NULL OR length(card_number) = 4),
  card_type text,
  card_company text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'terminated', 'payment_failed')),
  next_billing_date timestamptz NOT NULL,
  last_billing_date timestamptz,
  billing_key_deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_billing_key_state CHECK (
    (status = 'terminated' AND billing_key_deleted_at IS NOT NULL) OR
    (status != 'terminated' AND billing_key_deleted_at IS NULL)
  )
);

COMMENT ON TABLE subscriptions IS 'Pro 구독 정보 및 토스페이먼츠 빌링키';
COMMENT ON COLUMN subscriptions.user_id IS '1:1 관계 (한 사용자당 최대 1개 구독)';
COMMENT ON COLUMN subscriptions.billing_key IS '토스페이먼츠 빌링키 (암호화 권장)';
COMMENT ON COLUMN subscriptions.customer_key IS 'UUID 형식 (유추 불가능)';
COMMENT ON COLUMN subscriptions.status IS 'active(활성), cancelled(취소 예약), terminated(해지 완료), payment_failed(결제 실패)';
```

---

### payments

**설명**: 결제 내역 추적 (첫 결제 + 정기 결제)

**Primary Key**: `id`

**Foreign Keys**:
- `user_id` → `users(id)`
- `subscription_id` → `subscriptions(id)`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | 결제 고유 ID |
| user_id | text | NO | - | 사용자 ID (외래키) |
| subscription_id | uuid | NO | - | 구독 ID (외래키) |
| payment_key | text | NO | - | 토스페이먼츠 paymentKey |
| order_id | text | NO | - | 주문 ID (UNIQUE) |
| amount | integer | NO | - | 결제 금액 (원) |
| status | text | NO | - | 결제 상태 (done/cancelled/failed) |
| paid_at | timestamptz | NO | - | 결제 완료 일시 |
| cancelled_at | timestamptz | YES | NULL | 취소 일시 |
| created_at | timestamptz | NO | NOW() | 레코드 생성 일시 |

```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  payment_key text NOT NULL,
  order_id text NOT NULL UNIQUE,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('done', 'cancelled', 'failed')),
  paid_at timestamptz NOT NULL,
  cancelled_at timestamptz CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status != 'cancelled' AND cancelled_at IS NULL)
  ),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS '결제 내역 (첫 결제 + 정기 결제)';
COMMENT ON COLUMN payments.amount IS '결제 금액 (원 단위, 9900)';
COMMENT ON COLUMN payments.status IS 'done(성공), cancelled(취소/환불), failed(실패)';
```

---

## 관계도

```
users (1) ────< (N) analyses
  │
  │ (1:1)
  │
  ├──────── (1) subscriptions
  │
  │ (1:N)
  │
  └────< (N) payments
              │
              │ (N:1)
              │
         subscriptions
```

- **users ↔ analyses**: 1:N (한 사용자는 여러 분석 보유)
- **users ↔ subscriptions**: 1:1 (한 사용자는 최대 1개 구독)
- **users ↔ payments**: 1:N (한 사용자는 여러 결제 내역)
- **subscriptions ↔ payments**: 1:N (한 구독은 여러 결제 내역)

---

## 인덱스 전략

### 필수 인덱스

```sql
-- users: PK(id), UNIQUE(email) 자동 생성

-- analyses: 대시보드 사용자별 분석 목록 조회 (최신순)
CREATE INDEX idx_analyses_user_created
  ON analyses(user_id, created_at DESC);

-- subscriptions: Cron Job용 (활성 구독 조회)
CREATE INDEX idx_subscriptions_status
  ON subscriptions(status) WHERE status != 'terminated';

-- subscriptions: Cron Job용 (결제일 조회)
CREATE INDEX idx_subscriptions_next_billing
  ON subscriptions(next_billing_date) WHERE status = 'active';

-- payments: 사용자별 결제 내역 조회
CREATE INDEX idx_payments_user_id
  ON payments(user_id, created_at DESC);

-- payments: 구독별 결제 내역 조회
CREATE INDEX idx_payments_subscription_id
  ON payments(subscription_id, created_at DESC);
```

**인덱스 설계 원칙**:
- **복합 인덱스**: 자주 함께 조회되는 컬럼 (user_id, created_at)
- **부분 인덱스**: WHERE 조건으로 인덱스 크기 최소화
- **DESC 정렬**: 최신 데이터 조회 최적화

---

## Row Level Security (RLS)

### users 테이블

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 조회
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Webhook에서만 생성 (service_role)
CREATE POLICY "users_insert_service"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Webhook 및 서버 액션에서 업데이트
CREATE POLICY "users_update_service"
  ON users FOR UPDATE
  TO service_role
  USING (true);
```

### analyses 테이블

```sql
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 본인 분석만 조회
CREATE POLICY "analyses_select_own"
  ON analyses FOR SELECT
  USING (user_id = auth.uid());

-- 본인 분석만 생성 (서버 액션)
CREATE POLICY "analyses_insert_own"
  ON analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 삭제는 service_role만 (관리용)
CREATE POLICY "analyses_delete_service"
  ON analyses FOR DELETE
  TO service_role
  USING (true);
```

### subscriptions 테이블

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인 구독만 조회
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- 서버 액션에서만 생성/수정
CREATE POLICY "subscriptions_insert_service"
  ON subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "subscriptions_update_service"
  ON subscriptions FOR UPDATE
  TO service_role
  USING (true);
```

### payments 테이블

```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 본인 결제 내역만 조회
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

-- 생성은 서버 액션에서만
CREATE POLICY "payments_insert_service"
  ON payments FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**RLS 설계 원칙**:
- **읽기**: 본인 데이터만 조회 (auth.uid() 검증)
- **쓰기**: service_role만 허용 (서버 액션/Webhook에서만)
- **보안**: 클라이언트에서 직접 수정 불가

---

## 트리거 (Triggers)

### updated_at 자동 업데이트

```sql
-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- subscriptions 테이블 트리거
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Supabase Cron Job

### 1. Extension 활성화

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Vault에 Cron Secret 저장

```sql
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'cron_secret',
  'REPLACE_WITH_YOUR_SECURE_RANDOM_STRING',
  'Secret for authenticating cron jobs'
) ON CONFLICT (name) DO NOTHING;
```

### 3. Cron Job 함수

```sql
CREATE OR REPLACE FUNCTION process_subscription_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Next.js API 호출
  PERFORM
    net.http_post(
      url := 'https://your-domain.com/api/subscription/process',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
      ),
      body := jsonb_build_object(
        'date', CURRENT_DATE::text
      )
    );
END;
$$;
```

### 4. Cron Job 등록 (매일 오전 2시)

```sql
SELECT cron.schedule(
  'process-subscription-payments',
  '0 2 * * *',
  'SELECT process_subscription_payments();'
);
```

---

## 쿼리 예제

### 대시보드: 사주분석 목록

```typescript
const { data: analyses } = await supabase
  .from('analyses')
  .select('id, name, birth_date, gender, created_at')
  .order('created_at', { ascending: false })
  .limit(10);
```

### 새 사주분석 생성 (트랜잭션)

```typescript
// 1. 잔여 횟수 확인
const { data: user } = await supabase
  .from('users')
  .select('test_count, subscription_status')
  .eq('id', userId)
  .single();

if (user.test_count <= 0) {
  throw new Error('검사 횟수 부족');
}

// 2. 분석 저장
const { data: analysis } = await supabase
  .from('analyses')
  .insert({
    user_id: userId,
    name: input.name,
    birth_date: input.birthDate,
    birth_time: input.birthTime || null,
    gender: input.gender,
    analysis_result: aiResult,
    model_used: user.subscription_status === 'pro' ? 'pro' : 'flash',
  })
  .select()
  .single();

// 3. 횟수 차감
await supabase
  .from('users')
  .update({ test_count: user.test_count - 1 })
  .eq('id', userId);
```

### 구독 정보 조회 (JOIN)

```typescript
const { data } = await supabase
  .from('subscriptions')
  .select(`
    *,
    users (
      email,
      name,
      subscription_status,
      test_count
    )
  `)
  .eq('user_id', userId)
  .single();
```

### Cron: 오늘이 결제일인 활성 구독

```typescript
const today = new Date().toISOString().split('T')[0];

const { data: subscriptions } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('status', 'active')
  .lte('next_billing_date', today);
```

### Cron: 취소 예약 구독 해지

```typescript
const today = new Date().toISOString().split('T')[0];

const { data: subscriptionsToTerminate } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('status', 'cancelled')
  .lt('next_billing_date', today);

// 각 구독에 대해 빌링키 삭제 후
for (const sub of subscriptionsToTerminate) {
  await deleteBillingKey(sub.billing_key);

  await supabase
    .from('subscriptions')
    .update({
      status: 'terminated',
      billing_key_deleted_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      test_count: 0,
    })
    .eq('id', sub.user_id);
}
```

---

## 전체 마이그레이션 스크립트

```sql
-- 1. users 테이블
CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  subscription_status text NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'pro', 'cancelled', 'payment_failed')),
  test_count integer NOT NULL DEFAULT 3 CHECK (test_count >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Clerk 사용자 정보 및 구독 상태';

-- 2. analyses 테이블
CREATE TABLE analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date NOT NULL,
  birth_time text CHECK (birth_time IS NULL OR birth_time ~ '^\d{2}:\d{2}$'),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  analysis_result text NOT NULL,
  model_used text NOT NULL CHECK (model_used IN ('flash', 'pro')),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE analyses IS '사주분석 데이터 및 AI 생성 결과';

-- 3. subscriptions 테이블
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  billing_key text NOT NULL,
  customer_key text NOT NULL,
  card_number text CHECK (card_number IS NULL OR length(card_number) = 4),
  card_type text,
  card_company text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'terminated', 'payment_failed')),
  next_billing_date timestamptz NOT NULL,
  last_billing_date timestamptz,
  billing_key_deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_billing_key_state CHECK (
    (status = 'terminated' AND billing_key_deleted_at IS NOT NULL) OR
    (status != 'terminated' AND billing_key_deleted_at IS NULL)
  )
);

COMMENT ON TABLE subscriptions IS 'Pro 구독 정보 및 토스페이먼츠 빌링키';

-- 4. payments 테이블
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  payment_key text NOT NULL,
  order_id text NOT NULL UNIQUE,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('done', 'cancelled', 'failed')),
  paid_at timestamptz NOT NULL,
  cancelled_at timestamptz CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status != 'cancelled' AND cancelled_at IS NULL)
  ),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS '결제 내역 (첫 결제 + 정기 결제)';

-- 5. 인덱스 생성
CREATE INDEX idx_analyses_user_created
  ON analyses(user_id, created_at DESC);

CREATE INDEX idx_subscriptions_status
  ON subscriptions(status) WHERE status != 'terminated';

CREATE INDEX idx_subscriptions_next_billing
  ON subscriptions(next_billing_date) WHERE status = 'active';

CREATE INDEX idx_payments_user_id
  ON payments(user_id, created_at DESC);

CREATE INDEX idx_payments_subscription_id
  ON payments(subscription_id, created_at DESC);

-- 6. RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 7. users RLS 정책
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_insert_service"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "users_update_service"
  ON users FOR UPDATE
  TO service_role
  USING (true);

-- 8. analyses RLS 정책
CREATE POLICY "analyses_select_own"
  ON analyses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "analyses_insert_own"
  ON analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "analyses_delete_service"
  ON analyses FOR DELETE
  TO service_role
  USING (true);

-- 9. subscriptions RLS 정책
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "subscriptions_insert_service"
  ON subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "subscriptions_update_service"
  ON subscriptions FOR UPDATE
  TO service_role
  USING (true);

-- 10. payments RLS 정책
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "payments_insert_service"
  ON payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 11. 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 트리거 적용
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. Extension 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 14. Vault에 Cron Secret 저장
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'cron_secret',
  'REPLACE_WITH_YOUR_SECURE_RANDOM_STRING',
  'Secret for authenticating cron jobs'
) ON CONFLICT (name) DO NOTHING;

-- 15. Cron Job 함수
CREATE OR REPLACE FUNCTION process_subscription_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://your-domain.com/api/subscription/process',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
      ),
      body := jsonb_build_object(
        'date', CURRENT_DATE::text
      )
    );
END;
$$;

-- 16. Cron Job 등록 (매일 오전 2시)
SELECT cron.schedule(
  'process-subscription-payments',
  '0 2 * * *',
  'SELECT process_subscription_payments();'
);
```

---

## 환경 변수

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_...
TOSS_SECRET_KEY=test_gsk_docs_...

# Gemini API
GEMINI_API_KEY=AIzaSy...

# Cron Job 인증
CRON_SECRET=your-secure-random-string

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 주요 설계 결정

### 1. users.id는 text 타입
- Clerk user ID는 `user_2xxx` 형식 (UUID 아님)
- PostgreSQL의 text 타입 사용

### 2. birth_time은 text 타입
- `time` 타입은 timezone 정보로 복잡도 증가
- 간단한 `HH:mm` 형식 문자열로 저장
- 정규식 검증: `^\d{2}:\d{2}$`

### 3. 구독은 1:1 관계
- 한 사용자는 최대 1개 활성 구독
- `subscriptions.user_id`에 UNIQUE 제약

### 4. test_count는 users 테이블에
- 구독 상태와 함께 관리
- JOIN 없이 빠른 조회 가능

### 5. 인덱스 최소화
- 실제 쿼리 패턴에만 인덱스 생성
- 부분 인덱스로 크기 최소화
- 과도한 인덱스는 INSERT 성능 저하

### 6. RLS 정책 분리
- 읽기: 본인만 (auth.uid() 검증)
- 쓰기: service_role만 (서버에서만)

### 7. 제약 조건 강화
- CHECK 제약으로 데이터 무결성 보장
- `card_number` 길이 검증 (4자리)
- `billing_key_deleted_at` 상태 검증

### 8. 코멘트 추가
- 테이블/컬럼 설명으로 문서화
- 유지보수 편의성 향상

---

## 보안 고려사항

### 1. 빌링키 보안
- **암호화 권장**: Supabase Vault 또는 별도 암호화
- **로그 노출 금지**: 절대 로그에 출력하지 않음
- **재조회 불가**: 한 번 발급되면 다시 조회 불가

### 2. customerKey
- **UUID 사용**: 유추 불가능
- **이메일/전화번호 사용 금지**

### 3. RLS (Row Level Security)
- **모든 테이블 활성화**
- **본인 데이터만 접근**
- **service_role은 RLS 우회** (서버에서만)

### 4. API 키 관리
- **환경 변수로 관리**
- **GitHub 커밋 금지**
- **클라이언트 노출 금지** (SECRET 키)

### 5. Cron Secret
- **Supabase Vault 암호화 저장**
- **환경 변수로 백업**
- **요청 검증 필수**

---

## 성능 최적화

### 1. 인덱스 전략
- **복합 인덱스**: 자주 함께 조회되는 컬럼
- **부분 인덱스**: WHERE 조건으로 크기 감소
- **DESC 정렬**: 최신 데이터 조회 최적화

### 2. 쿼리 최적화
- **SELECT 컬럼 명시**: 필요한 컬럼만 조회
- **LIMIT 사용**: 페이지네이션
- **트랜잭션 최소화**: 필요한 경우만

### 3. 캐싱 전략
- **분석 결과**: 동일 생년월일시는 캐시 활용 가능
- **구독 정보**: 자주 변경되지 않으므로 캐시 적합

### 4. 연결 풀 관리
- **Supabase 자동 관리**
- **Connection Pooling 활성화**

---

## 모니터링 및 유지보수

### 1. 로그 수집
- **에러 로그**: Supabase 대시보드
- **Cron Job 로그**: pg_cron 실행 이력
- **결제 로그**: payments 테이블

### 2. 메트릭
- **쿼리 성능**: Supabase Query Performance
- **인덱스 사용률**: pg_stat_user_indexes
- **테이블 크기**: pg_total_relation_size()

### 3. 백업
- **자동 백업**: Supabase 자동 백업 활성화
- **수동 백업**: 중요 데이터는 정기 백업
- **복구 테스트**: 주기적 복구 테스트

### 4. 알림
- **결제 실패**: 이메일 알림
- **Cron Job 실패**: 모니터링 알림
- **디스크 용량**: 임계치 알림

---

## 확장성 고려사항

### 1. 데이터 증가 대응
- **파티셔닝**: analyses 테이블 (created_at 기준)
- **아카이빙**: 오래된 분석 결과 별도 테이블
- **인덱스 재구성**: 정기적 REINDEX

### 2. 트래픽 증가 대응
- **읽기 복제본**: Supabase Read Replicas
- **캐싱 레이어**: Redis 추가 고려
- **Connection Pooling**: 연결 풀 크기 조정

### 3. 기능 확장
- **새 테이블 추가**: 기존 테이블 영향 최소화
- **컬럼 추가**: NOT NULL 제약 주의
- **마이그레이션**: 롤백 계획 필수

---

## 버전 관리

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 4.0 | 2025-10-28 | Claude Code | YC CTO 관점 개선: 제약 조건 강화, 인덱스 최적화, 코멘트 추가, 보안 강화 |
| 3.0 | 2025-10-28 | Claude Code | 구독 관리 기능 추가, 전체 스키마 개선 |
| 2.0 | 2025-10-27 | Claude Code | 간결화 및 오버엔지니어링 제거 |
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |

---

**최종 검토**: 2025-10-28
**PostgreSQL 버전**: 15+
**Supabase 호환**: 최신 버전
