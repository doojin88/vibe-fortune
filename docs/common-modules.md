# 공통 모듈 작업 계획

## 문서 개요

본 문서는 Vibe Fortune 프로젝트의 페이지 단위 개발을 시작하기 전에 구현해야 할 공통 모듈 및 로직을 정의합니다. 모든 공통 모듈은 특정 페이지에 의존적이지 않으며, 여러 페이지에서 재사용 가능하도록 설계됩니다.

**작성 원칙:**
- 문서(PRD, userflow, database, tosspayments)에 명시된 내용만 구현
- 오버엔지니어링 금지
- 페이지 단위 병렬 개발이 가능하도록 코드 conflict 최소화

**현재 상태:**
- 기본 프로젝트 구조 완성 (Next.js 15, Supabase, Clerk)
- 사주분석 핵심 기능 구현 완료
- 구독 관리 기능 미구현

**최근 변경사항 (2025-10-28):**
- 구독 관리 기능 요구사항 추가
- 토스페이먼츠 자동결제(빌링) 연동 필요
- subscriptions, payments 테이블 추가
- 정기 결제 및 자동 해지 Cron Job 필요

---

## 1. 데이터베이스 스키마 및 타입

### 1.1 Supabase Database Types (업데이트 필요)

**필요한 이유:**
- 구독 관련 테이블(subscriptions, payments) 타입 정의 추가
- users 테이블에 구독 관련 필드 추가
- 타입 안정성 확보

**현재 상태:**
- ✅ 구현됨 (`src/lib/supabase/types.ts`)
- ❌ 구독 관련 타입 누락

**구현 방법:**
```typescript
// src/lib/supabase/types.ts (업데이트)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // text (Clerk user ID)
          email: string;
          name: string;
          subscription_status: 'free' | 'pro' | 'cancelled' | 'payment_failed';
          test_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          subscription_status?: 'free' | 'pro' | 'cancelled' | 'payment_failed';
          test_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          subscription_status?: 'free' | 'pro' | 'cancelled' | 'payment_failed';
          test_count?: number;
          updated_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time: string | null;
          gender: 'male' | 'female';
          analysis_result: string;
          model_used: 'flash' | 'pro';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time?: string | null;
          gender: 'male' | 'female';
          analysis_result: string;
          model_used: 'flash' | 'pro';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          birth_date?: string;
          birth_time?: string | null;
          gender?: 'male' | 'female';
          analysis_result?: string;
          model_used?: 'flash' | 'pro';
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          billing_key: string;
          customer_key: string;
          card_number: string | null;
          card_type: string | null;
          card_company: string | null;
          status: 'active' | 'cancelled' | 'terminated' | 'payment_failed';
          next_billing_date: string;
          last_billing_date: string | null;
          billing_key_deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          billing_key: string;
          customer_key: string;
          card_number?: string | null;
          card_type?: string | null;
          card_company?: string | null;
          status?: 'active' | 'cancelled' | 'terminated' | 'payment_failed';
          next_billing_date: string;
          last_billing_date?: string | null;
          billing_key_deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          billing_key?: string;
          customer_key?: string;
          card_number?: string | null;
          card_type?: string | null;
          card_company?: string | null;
          status?: 'active' | 'cancelled' | 'terminated' | 'payment_failed';
          next_billing_date?: string;
          last_billing_date?: string | null;
          billing_key_deleted_at?: string | null;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          payment_key: string;
          order_id: string;
          amount: number;
          status: 'done' | 'cancelled' | 'failed';
          paid_at: string;
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          payment_key: string;
          order_id: string;
          amount: number;
          status: 'done' | 'cancelled' | 'failed';
          paid_at: string;
          cancelled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          payment_key?: string;
          order_id?: string;
          amount?: number;
          status?: 'done' | 'cancelled' | 'failed';
          paid_at?: string;
          cancelled_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

export type User = Database['public']['Tables']['users']['Row'];
export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
```

**사용될 곳:**
- Supabase 클라이언트 생성 시 제네릭 타입
- 모든 데이터베이스 쿼리
- Server Actions
- 구독 관리 페이지

**우선순위:** 최고 (P0) - 구독 기능 개발 전 필수

---

### 1.2 Supabase 마이그레이션 스크립트 (업데이트 필요)

**필요한 이유:**
- 구독 관련 테이블 추가 (subscriptions, payments)
- users 테이블에 구독 필드 추가
- Cron Job 설정

**현재 상태:**
- ✅ 기본 스키마 구현됨
- ❌ 구독 관련 테이블 미구현

**구현 방법:**
```sql
-- supabase/migrations/20251028000001_add_subscription_tables.sql

-- 1. users 테이블에 구독 필드 추가
ALTER TABLE users
  ADD COLUMN subscription_status text NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'pro', 'cancelled', 'payment_failed')),
  ADD COLUMN test_count integer NOT NULL DEFAULT 3 CHECK (test_count >= 0),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT NOW();

COMMENT ON COLUMN users.subscription_status IS '구독 상태: free(초기 3회), pro(월 10회), cancelled(취소 예약), payment_failed(결제 실패)';
COMMENT ON COLUMN users.test_count IS '잔여 검사 횟수';

-- 2. subscriptions 테이블 생성
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

-- 3. payments 테이블 생성
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

-- 4. 인덱스 생성
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE status != 'terminated';
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active';
CREATE INDEX idx_payments_user_id ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id, created_at DESC);

-- 5. RLS 활성화
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 6. subscriptions RLS 정책
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

-- 7. payments RLS 정책
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "payments_insert_service"
  ON payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 8. updated_at 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Cron Extension 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 10. Vault에 Cron Secret 저장
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'cron_secret',
  'REPLACE_WITH_YOUR_SECURE_RANDOM_STRING',
  'Secret for authenticating cron jobs'
) ON CONFLICT (name) DO NOTHING;

-- 11. Cron Job 함수
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

-- 12. Cron Job 등록 (매일 오전 2시)
SELECT cron.schedule(
  'process-subscription-payments',
  '0 2 * * *',
  'SELECT process_subscription_payments();'
);
```

**사용될 곳:**
- Supabase 프로젝트 초기 세팅
- 로컬 개발 환경

**우선순위:** 최고 (P0) - 구독 기능 개발 전 필수

---

## 2. 환경 변수 관리 (업데이트 필요)

### 2.1 서버 전용 환경 변수

**현재 상태:**
- ✅ 구현됨 (`src/constants/server-env.ts`)
- ❌ 토스페이먼츠 키 누락

**구현 방법:**
```typescript
// src/constants/server-env.ts (업데이트)
import { z } from 'zod';
import 'server-only';

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
  TOSS_SECRET_KEY: z.string().min(1), // 추가
  CRON_SECRET: z.string().min(1), // 추가
});

const _serverEnv = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

if (!_serverEnv.success) {
  console.error('서버 환경 변수 검증 실패:', _serverEnv.error.flatten().fieldErrors);
  throw new Error('서버 환경 변수를 확인하세요.');
}

export const serverEnv: ServerEnv = _serverEnv.data;
```

**사용될 곳:**
- 토스페이먼츠 API 호출
- Cron Job 인증

**우선순위:** 최고 (P0)

---

### 2.2 클라이언트 환경 변수

**현재 상태:**
- ✅ 구현됨 (`src/constants/env.ts`)
- ❌ 토스페이먼츠 클라이언트 키 누락

**구현 방법:**
```typescript
// src/constants/env.ts (업데이트)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().min(1), // 추가
  NEXT_PUBLIC_BASE_URL: z.string().url(), // 추가
});
```

**우선순위:** 최고 (P0)

---

## 3. 토스페이먼츠 연동

### 3.1 토스페이먼츠 SDK 초기화

**필요한 이유:**
- 구독 카드 등록 UI 제공
- 본인인증 자동 처리
- 빌링키 발급

**구현 방법:**
```typescript
// src/lib/tosspayments/client.ts
'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { env } from '@/constants/env';

let tossPaymentsPromise: Promise<any> | null = null;

export async function getTossPayments() {
  if (!tossPaymentsPromise) {
    tossPaymentsPromise = loadTossPayments(env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
  }
  return tossPaymentsPromise;
}

export async function createPayment(customerKey: string) {
  const tossPayments = await getTossPayments();
  return tossPayments.payment({ customerKey });
}
```

**사용될 곳:**
- 구독 관리 페이지 (카드 등록)

**우선순위:** 최고 (P0)

---

### 3.2 빌링키 발급 API

**필요한 이유:**
- authKey를 받아 빌링키 발급
- Supabase에 빌링키 저장

**구현 방법:**
```typescript
// src/app/api/subscription/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { serverEnv } from '@/constants/server-env';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authKey, customerKey } = await request.json();

    if (!authKey || !customerKey) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 빌링키 발급
    const encodedKey = Buffer.from(`${serverEnv.TOSS_SECRET_KEY}:`).toString('base64');

    const response = await fetch(
      'https://api.tosspayments.com/v1/billing/authorizations/issue',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authKey,
          customerKey,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('토스페이먼츠 API 에러:', error);
      throw new Error(error.message || '빌링키 발급 실패');
    }

    const billingData = await response.json();

    // Supabase에 저장
    const supabase = createAdminClient();
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        billing_key: billingData.billingKey,
        customer_key: customerKey,
        card_number: billingData.card?.number?.slice(-4),
        card_type: billingData.card?.cardType,
        card_company: billingData.card?.issuerCode,
        status: 'active',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (dbError) {
      console.error('DB 저장 실패:', dbError);
      throw new Error('구독 정보 저장 실패');
    }

    // 첫 결제 진행
    const chargeResponse = await fetch(
      `${env.NEXT_PUBLIC_BASE_URL}/api/subscription/charge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingKey: billingData.billingKey,
          customerKey,
          amount: 9900,
        }),
      }
    );

    if (!chargeResponse.ok) {
      // 첫 결제 실패 시 구독 삭제
      await supabase
        .from('subscriptions')
        .delete()
        .eq('billing_key', billingData.billingKey);

      throw new Error('첫 결제 실패');
    }

    // users 테이블 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'pro',
        test_count: 10,
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: '구독이 성공적으로 등록되었습니다.'
    });

  } catch (error: any) {
    console.error('빌링키 발급 실패:', error);
    return NextResponse.json(
      { error: error.message || '빌링키 발급에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

**사용될 곳:**
- 구독 성공 페이지

**우선순위:** 최고 (P0)

---

### 3.3 자동결제 승인 API

**필요한 이유:**
- 빌링키로 정기 결제 실행
- Cron Job에서 호출

**구현 방법:**
```typescript
// src/app/api/subscription/charge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/constants/server-env';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { billingKey, customerKey, amount, userId } = await request.json();

    const encodedKey = Buffer.from(`${serverEnv.TOSS_SECRET_KEY}:`).toString('base64');
    const orderId = `ORDER_${Date.now()}_${uuidv4().slice(0, 8)}`;

    const response = await fetch(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey,
          amount,
          orderId,
          orderName: 'Vibe Fortune Pro 구독',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const payment = await response.json();

    // 결제 내역 저장
    const supabase = createAdminClient();

    // subscription_id 조회
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('billing_key', billingKey)
      .single();

    if (subscription) {
      await supabase.from('payments').insert({
        user_id: userId,
        subscription_id: subscription.id,
        payment_key: payment.paymentKey,
        order_id: orderId,
        amount,
        status: 'done',
        paid_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      paymentKey: payment.paymentKey,
    });

  } catch (error: any) {
    console.error('자동결제 승인 실패:', error);
    return NextResponse.json(
      { error: error.message || '결제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

**사용될 곳:**
- 빌링키 발급 후 첫 결제
- Cron Job 정기 결제

**우선순위:** 최고 (P0)

---

### 3.4 Cron Job 정기 결제 처리 API

**필요한 이유:**
- 매일 오전 2시 자동 실행
- 오늘이 결제일인 구독 처리
- 결제 성공 시 검사 횟수 충전
- 결제 실패 시 구독 상태 변경

**구현 방법:**
```typescript
// src/app/api/subscription/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { serverEnv } from '@/constants/server-env';
import { env } from '@/constants/env';

export async function POST(request: NextRequest) {
  // Cron 인증
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== serverEnv.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. 오늘이 결제일인 활성 구독 조회
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('next_billing_date', today);

    if (error) throw error;

    const results = [];

    // 2. 각 구독 결제 처리
    for (const subscription of subscriptions || []) {
      try {
        const chargeResponse = await fetch(
          `${env.NEXT_PUBLIC_BASE_URL}/api/subscription/charge`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              billingKey: subscription.billing_key,
              customerKey: subscription.customer_key,
              amount: 9900,
              userId: subscription.user_id,
            }),
          }
        );

        if (chargeResponse.ok) {
          // 결제 성공
          await supabase
            .from('subscriptions')
            .update({
              last_billing_date: new Date().toISOString(),
              next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', subscription.id);

          await supabase
            .from('users')
            .update({ test_count: 10 })
            .eq('id', subscription.user_id);

          results.push({ subscriptionId: subscription.id, success: true });
        } else {
          // 결제 실패
          await supabase
            .from('subscriptions')
            .update({ status: 'payment_failed' })
            .eq('id', subscription.id);

          await supabase
            .from('users')
            .update({ subscription_status: 'payment_failed' })
            .eq('id', subscription.user_id);

          results.push({ subscriptionId: subscription.id, success: false });
        }
      } catch (error: any) {
        console.error(`구독 ${subscription.id} 처리 실패:`, error);
        results.push({ subscriptionId: subscription.id, success: false, error: error.message });
      }
    }

    // 3. 취소 예약 구독 해지 처리
    const { data: cancelledSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'cancelled')
      .lt('next_billing_date', today);

    for (const subscription of cancelledSubscriptions || []) {
      try {
        // 빌링키 삭제 (토스페이먼츠 API)
        const encodedKey = Buffer.from(`${serverEnv.TOSS_SECRET_KEY}:`).toString('base64');
        await fetch(
          `https://api.tosspayments.com/v1/billing/authorizations/${subscription.billing_key}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${encodedKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerKey: subscription.customer_key,
            }),
          }
        );

        // 구독 해지
        await supabase
          .from('subscriptions')
          .update({
            status: 'terminated',
            billing_key_deleted_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        await supabase
          .from('users')
          .update({
            subscription_status: 'free',
            test_count: 0,
          })
          .eq('id', subscription.user_id);
      } catch (error) {
        console.error(`구독 ${subscription.id} 해지 실패:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });

  } catch (error: any) {
    console.error('정기 결제 처리 실패:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**사용될 곳:**
- Supabase Cron Job (매일 오전 2시)

**우선순위:** 최고 (P0)

---

### 3.5 구독 취소/재개 Server Actions

**필요한 이유:**
- 사용자가 구독 취소/재개 요청
- 구독 상태 업데이트

**구현 방법:**
```typescript
// src/features/subscription/actions/cancel-subscription.ts
'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function cancelSubscription() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = await createClient();

    // 구독 상태 변경
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId);

    if (subError) throw subError;

    // users 테이블 업데이트
    const { error: userError } = await supabase
      .from('users')
      .update({ subscription_status: 'cancelled' })
      .eq('id', userId);

    if (userError) throw userError;

    return { success: true };
  } catch (error) {
    console.error('구독 취소 실패:', error);
    return { success: false, error: '구독 취소에 실패했습니다.' };
  }
}

// src/features/subscription/actions/resume-subscription.ts
'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function resumeSubscription() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = await createClient();

    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('user_id', userId);

    if (subError) throw subError;

    const { error: userError } = await supabase
      .from('users')
      .update({ subscription_status: 'pro' })
      .eq('id', userId);

    if (userError) throw userError;

    return { success: true };
  } catch (error) {
    console.error('구독 재개 실패:', error);
    return { success: false, error: '구독 재개에 실패했습니다.' };
  }
}
```

**사용될 곳:**
- 구독 관리 페이지

**우선순위:** 최고 (P0)

---

## 4. 공통 UI 컴포넌트 (기존 구현 완료)

### 4.1 마크다운 렌더러

**현재 상태:** ✅ 구현됨 (`src/components/markdown-renderer.tsx`)

**우선순위:** 완료

---

### 4.2 로딩 스피너

**현재 상태:** ✅ 구현됨 (`src/components/ui/spinner.tsx`)

**우선순위:** 완료

---

### 4.3 Date Picker

**현재 상태:** ✅ 구현됨 (`src/components/ui/date-picker.tsx`)

**우선순위:** 완료

---

### 4.4 Time Picker

**현재 상태:** ✅ 구현됨 (`src/components/ui/time-picker.tsx`)

**우선순위:** 완료

---

### 4.5 Empty State

**현재 상태:** ✅ 구현됨 (`src/components/ui/empty-state.tsx`)

**우선순위:** 완료

---

## 5. 공통 유틸리티 함수 (기존 구현 완료)

### 5.1 날짜 포맷팅

**현재 상태:** ✅ 구현됨 (`src/lib/utils/date.ts`)

**우선순위:** 완료

---

### 5.2 클립보드 복사

**현재 상태:** ✅ 구현됨 (`src/lib/utils/clipboard.ts`)

**우선순위:** 완료

---

## 6. 구독 관리 공통 로직

### 6.1 구독 정보 조회 함수

**필요한 이유:**
- 구독 관리 페이지, 사이드바에서 사용
- 현재 구독 상태 확인

**구현 방법:**
```typescript
// src/features/subscription/queries/get-subscription.ts
import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';
import 'server-only';

export type SubscriptionInfo = {
  status: 'free' | 'pro' | 'cancelled' | 'payment_failed';
  testCount: number;
  nextBillingDate: string | null;
  cardNumber: string | null;
  cardCompany: string | null;
};

export async function getSubscription(): Promise<SubscriptionInfo | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();

  // users 테이블에서 기본 정보 조회
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status, test_count')
    .eq('id', userId)
    .single();

  if (!user) return null;

  // 구독 정보 조회 (Pro인 경우)
  if (user.subscription_status === 'pro' || user.subscription_status === 'cancelled') {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('next_billing_date, card_number, card_company, status')
      .eq('user_id', userId)
      .single();

    return {
      status: user.subscription_status,
      testCount: user.test_count,
      nextBillingDate: subscription?.next_billing_date || null,
      cardNumber: subscription?.card_number || null,
      cardCompany: subscription?.card_company || null,
    };
  }

  return {
    status: user.subscription_status,
    testCount: user.test_count,
    nextBillingDate: null,
    cardNumber: null,
    cardCompany: null,
  };
}
```

**사용될 곳:**
- 구독 관리 페이지
- 대시보드 사이드바

**우선순위:** 최고 (P0)

---

### 6.2 잔여 횟수 확인 및 차감

**필요한 이유:**
- 새 검사하기 시 잔여 횟수 확인
- 검사 완료 시 횟수 차감

**현재 상태:**
- ✅ 기본 로직 구현됨 (`src/features/saju/actions/create-saju-test.ts`)
- ❌ 구독 상태에 따른 모델 선택 로직 미구현

**업데이트 방법:**
```typescript
// src/features/saju/actions/create-saju-test.ts (업데이트)
'use server';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server-client';
import { geminiClient } from '@/lib/gemini/client';
import { generateSajuPrompt, generateProSajuPrompt } from '@/lib/gemini/prompts';
import { sajuInputSchema, type SajuInput } from '@/features/saju/types/input';

export async function createSajuTest(input: SajuInput) {
  try {
    const validatedInput = sajuInputSchema.parse(input);
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    const supabase = await createClient();

    // 사용자 정보 조회 (구독 상태 포함)
    const { data: user } = await supabase
      .from('users')
      .select('test_count, subscription_status')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, error: '사용자 정보를 찾을 수 없습니다' };
    }

    // 잔여 횟수 확인
    if (user.test_count <= 0) {
      return {
        success: false,
        error: '검사 횟수가 부족합니다. 구독 페이지로 이동하시겠습니까?',
        needSubscription: true,
      };
    }

    // 구독 상태에 따른 모델 선택
    const isPro = user.subscription_status === 'pro' || user.subscription_status === 'cancelled';
    const model = isPro ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const prompt = isPro
      ? generateProSajuPrompt(validatedInput)
      : generateSajuPrompt(validatedInput);

    // Gemini API 호출
    const { text: result } = await geminiClient.generateContent(prompt, model);

    // 데이터베이스 저장
    const { data: analysis, error: dbError } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        name: validatedInput.name,
        birth_date: validatedInput.birthDate,
        birth_time: validatedInput.birthTime || null,
        gender: validatedInput.gender,
        analysis_result: result,
        model_used: isPro ? 'pro' : 'flash',
      })
      .select()
      .single();

    if (dbError || !analysis) {
      console.error('데이터베이스 저장 실패:', dbError);
      return { success: false, error: '분석 결과 저장에 실패했습니다' };
    }

    // 횟수 차감
    await supabase
      .from('users')
      .update({ test_count: user.test_count - 1 })
      .eq('id', userId);

    redirect(`/dashboard/results/${analysis.id}`);
  } catch (error) {
    console.error('사주분석 생성 실패:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: '분석 중 오류가 발생했습니다' };
  }
}
```

**우선순위:** 최고 (P0)

---

## 7. Gemini API 관련 (업데이트 필요)

### 7.1 Gemini Client

**현재 상태:** ✅ 구현됨 (`src/lib/gemini/client.ts`)

**우선순위:** 완료

---

### 7.2 프롬프트 생성

**현재 상태:**
- ✅ 기본 프롬프트 구현됨
- ❌ Pro 전용 프롬프트 미구현

**업데이트 방법:**
```typescript
// src/lib/gemini/prompts.ts (업데이트)
import type { SajuInput } from '@/features/saju/types/input';
import 'server-only';

export function generateSajuPrompt(input: SajuInput): string {
  const birthTimeText = input.birthTime || '미상';
  const genderText = input.gender === 'male' ? '남성' : '여성';

  return `당신은 20년 경력의 전문 사주팔자 상담사입니다.

**입력 정보**:
- 성함: ${input.name}
- 생년월일: ${input.birthDate}
- 출생시간: ${birthTimeText}
- 성별: ${genderText}

**분석 요구사항**:
다음 섹션을 포함하여 상세한 사주분석 결과를 마크다운 형식으로 작성해주세요:

1. **천간(天干)과 지지(地支)**: 생년월일시의 사주팔자를 계산하고 해석
2. **오행(五行) 분석**: 목(木), 화(火), 토(土), 금(金), 수(水)의 균형 분석
3. **대운(大運)과 세운(歲運)**: 인생의 흐름과 현재 운세
4. **성격 분석**: 타고난 성격, 장단점, 대인관계 성향
5. **재운 분석**: 재물운, 재테크 성향
6. **건강운 분석**: 주의해야 할 건강 부위
7. **연애운 분석**: 이성관계, 결혼운

**출력 형식**: 마크다운 (제목, 목록, 강조 활용)

**금지 사항**:
- 의료·법률 조언 금지
- 확정적 미래 예측 금지
- 부정적·공격적 표현 금지

각 섹션은 명확한 제목(## 또는 ###)으로 구분하고, 이해하기 쉽게 작성해주세요.`;
}

export function generateProSajuPrompt(input: SajuInput): string {
  const birthTimeText = input.birthTime || '미상';
  const genderText = input.gender === 'male' ? '남성' : '여성';

  return `당신은 30년 경력의 전문 사주팔자 상담사입니다.

**입력 정보**:
- 성함: ${input.name}
- 생년월일: ${input.birthDate}
- 출생시간: ${birthTimeText}
- 성별: ${genderText}

**분석 요구사항** (Pro 고급 분석):
다음 섹션을 포함하여 상세한 사주분석 결과를 마크다운 형식으로 작성해주세요:

1. **천간(天干)과 지지(地支)**: 생년월일시의 사주팔자를 계산하고 해석
2. **오행(五行) 분석**: 목(木), 화(火), 토(土), 금(金), 수(水)의 균형 분석
3. **대운(大運)과 세운(歲運)**: 인생의 흐름과 현재 운세
4. **성격 분석**: 타고난 성격, 장단점, 대인관계 성향
5. **재운 분석**: 재물운, 재테크 성향
6. **건강운 분석**: 주의해야 할 건강 부위
7. **연애운 분석**: 이성관계, 결혼운
8. **직업운 및 사업운** (Pro 전용): 적합한 직업 분야, 사업 성공 가능성, 투자 조언
9. **월별 운세** (Pro 전용): 향후 12개월 운세 및 길일 분석

**출력 형식**: 마크다운 (제목, 목록, 강조 활용)

**금지 사항**:
- 의료·법률 조언 금지
- 확정적 미래 예측 금지
- 부정적·공격적 표현 금지

각 섹션은 명확한 제목(## 또는 ###)으로 구분하고, Pro 사용자에게 맞는 깊이 있는 분석을 제공해주세요.`;
}
```

**우선순위:** 최고 (P0)

---

## 8. 설치 필요 패키지

### 8.1 토스페이먼츠 SDK

```bash
pnpm add @tosspayments/tosspayments-sdk uuid
pnpm add -D @types/uuid
```

**우선순위:** 최고 (P0)

---

### 8.2 기타 (이미 설치됨)

```bash
# 이미 설치된 패키지들
# pnpm add @clerk/nextjs svix
# pnpm add react-markdown
# pnpm add date-fns react-day-picker
```

---

## 9. 구현 우선순위 요약

### P0 (최고 우선순위 - 구독 기능 개발 전 필수)

1. **데이터베이스 마이그레이션**
   - subscriptions, payments 테이블 생성
   - users 테이블에 구독 필드 추가
   - Cron Job 설정

2. **타입 정의 업데이트**
   - Database 타입에 구독 테이블 추가
   - Subscription, Payment 타입 export

3. **환경 변수 추가**
   - TOSS_SECRET_KEY (server)
   - NEXT_PUBLIC_TOSS_CLIENT_KEY (client)
   - CRON_SECRET (server)

4. **토스페이먼츠 SDK 통합**
   - SDK 초기화 (`src/lib/tosspayments/client.ts`)
   - 빌링키 발급 API (`src/app/api/subscription/confirm/route.ts`)
   - 자동결제 승인 API (`src/app/api/subscription/charge/route.ts`)

5. **Cron Job 정기 결제 처리**
   - 정기 결제 처리 API (`src/app/api/subscription/process/route.ts`)

6. **구독 관리 Actions**
   - 구독 취소 (`src/features/subscription/actions/cancel-subscription.ts`)
   - 구독 재개 (`src/features/subscription/actions/resume-subscription.ts`)

7. **구독 정보 조회 함수**
   - `src/features/subscription/queries/get-subscription.ts`

8. **Gemini 프롬프트 업데이트**
   - Pro 전용 프롬프트 추가

9. **사주분석 Action 업데이트**
   - 구독 상태에 따른 모델 선택 로직 추가

### P1 (높은 우선순위 - 완료됨)

- ✅ 모든 기본 UI 컴포넌트 구현 완료
- ✅ 유틸리티 함수 구현 완료
- ✅ Clerk Webhook 구현 완료

---

## 10. 디렉토리 구조

```
src/
├── lib/
│   ├── supabase/
│   │   ├── types.ts (업데이트 필요, P0)
│   │   ├── server-client.ts (완료)
│   │   ├── admin-client.ts (완료)
│   │   └── browser-client.ts (완료)
│   ├── gemini/
│   │   ├── client.ts (완료)
│   │   └── prompts.ts (업데이트 필요, P0)
│   ├── tosspayments/ (신규, P0)
│   │   └── client.ts
│   └── utils/
│       ├── date.ts (완료)
│       └── clipboard.ts (완료)
├── features/
│   ├── saju/
│   │   ├── types/
│   │   │   ├── input.ts (완료)
│   │   │   └── result.ts (완료)
│   │   ├── actions/
│   │   │   └── create-saju-test.ts (업데이트 필요, P0)
│   │   └── queries/
│   │       ├── get-saju-tests.ts (완료)
│   │       └── get-saju-test.ts (완료)
│   └── subscription/ (신규, P0)
│       ├── types/
│       │   └── subscription.ts
│       ├── actions/
│       │   ├── cancel-subscription.ts
│       │   └── resume-subscription.ts
│       └── queries/
│           └── get-subscription.ts
├── components/
│   ├── layout/
│   │   ├── dashboard-header.tsx (완료)
│   │   └── home-header.tsx (완료)
│   ├── ui/ (모두 완료)
│   └── markdown-renderer.tsx (완료)
├── constants/
│   ├── env.ts (업데이트 필요, P0)
│   └── server-env.ts (업데이트 필요, P0)
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── clerk/
│   │   │       └── route.ts (완료)
│   │   └── subscription/ (신규, P0)
│   │       ├── confirm/
│   │       │   └── route.ts
│   │       ├── charge/
│   │       │   └── route.ts
│   │       └── process/
│   │           └── route.ts
│   └── ...
└── middleware.ts (완료)
```

---

## 11. 작업 순서 권장사항

### Phase 1: 데이터베이스 및 환경 설정 (30분)
1. Supabase 마이그레이션 실행
2. 환경 변수 추가 (.env.local)
3. Database Types 업데이트

### Phase 2: 토스페이먼츠 SDK 통합 (1시간)
1. 패키지 설치
2. SDK 초기화 (`src/lib/tosspayments/client.ts`)
3. 빌링키 발급 API
4. 자동결제 승인 API

### Phase 3: Cron Job 및 정기 결제 (1시간)
1. Cron Job 정기 결제 처리 API
2. 구독 취소/재개 Actions
3. 구독 정보 조회 함수

### Phase 4: 기존 기능 업데이트 (30분)
1. Gemini 프롬프트 Pro 버전 추가
2. 사주분석 Action 업데이트 (모델 선택 로직)

### 총 예상 시간: 3시간

---

## 12. 검증 체크리스트

각 모듈 구현 후 다음 사항을 확인하세요:

### 데이터베이스
- [ ] subscriptions, payments 테이블 생성 완료
- [ ] users 테이블에 구독 필드 추가 완료
- [ ] RLS 정책 적용 완료
- [ ] Cron Job 등록 완료

### 환경 변수
- [ ] 토스페이먼츠 키 추가 완료
- [ ] CRON_SECRET 추가 완료
- [ ] 환경 변수 검증 통과

### 토스페이먼츠 연동
- [ ] SDK 초기화 정상 작동
- [ ] 빌링키 발급 테스트 성공
- [ ] 자동결제 승인 테스트 성공
- [ ] Cron Job 정기 결제 테스트 성공

### 구독 관리
- [ ] 구독 정보 조회 정상 작동
- [ ] 구독 취소 정상 작동
- [ ] 구독 재개 정상 작동

### 사주분석
- [ ] Pro 프롬프트 정상 작동
- [ ] 모델 선택 로직 정상 작동
- [ ] 잔여 횟수 확인 및 차감 정상 작동

---

## 13. 주의사항

### 1. 구독 정책
- 무료 사용자: 초기 3회만 제공 (소진 후 0회)
- Pro 구독자: 월 10회 (매월 갱신)
- 구독 취소 시 다음 결제일까지 Pro 혜택 유지

### 2. 빌링키 보안
- 빌링키는 암호화하여 저장 권장
- 로그에 절대 노출 금지
- 재조회 불가능 (한 번 발급되면 끝)

### 3. customerKey
- UUID 사용 (유추 불가능)
- 이메일, 전화번호 사용 금지

### 4. Cron Job
- Supabase Vault에 CRON_SECRET 저장
- 10초 이내 응답 필수
- 멱등성 보장 (중복 실행 대비)

### 5. 테스트 환경
- 토스페이먼츠 테스트 키 사용
- 실제 결제 없음
- 본인인증: 000000 입력

### 6. 에러 처리
- 결제 실패 시 재시도 로직 (3일 후)
- 결제 실패 시 이메일 알림 (추후 구현)
- 빌링키 삭제 실패 시 재시도 큐 (추후 구현)

---

## 14. 배포 전 확인사항

### 개발 환경
- [ ] 토스페이먼츠 테스트 키로 테스트 완료
- [ ] 빌링키 발급/삭제 플로우 테스트
- [ ] Cron Job 로컬 테스트 (수동 호출)

### 배포 환경
- [ ] 토스페이먼츠 라이브 키로 변경
- [ ] Cron Secret Supabase Vault에 저장
- [ ] Cron Job URL 배포 도메인으로 변경
- [ ] 웹훅 URL HTTPS 설정
- [ ] 토스페이먼츠 계약 완료 확인

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
| 2.0 | 2025-10-28 | Claude Code | 구독 관리 기능 추가, 토스페이먼츠 연동 추가, 전체 구조 개선 |
