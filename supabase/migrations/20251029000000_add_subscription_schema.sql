-- users 테이블에 구독 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free'
CHECK (subscription_status IN ('free', 'pro', 'cancelled', 'payment_failed'));

ALTER TABLE users
ADD COLUMN IF NOT EXISTS test_count integer NOT NULL DEFAULT 3;

COMMENT ON COLUMN users.subscription_status IS '구독 상태: free(무료), pro(Pro), cancelled(취소 예약), payment_failed(결제 실패)';
COMMENT ON COLUMN users.test_count IS '잔여 검사 횟수';

-- subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'payment_failed')),
  next_billing_date timestamptz,
  card_number text,
  card_company text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- payments 테이블 생성
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  status text NOT NULL
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_key text,
  order_id text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
  ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id
  ON payments(subscription_id);

-- updated_at 트리거 추가
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (가이드라인에 따라)
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
