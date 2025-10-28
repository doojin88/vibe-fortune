# 구독 관리 페이지 구현 계획

## 문서 개요

**페이지명**: 구독 관리 (`/subscription`)
**접근 권한**: 로그인 필요
**작성일**: 2025-10-28
**최종 수정일**: 2025-10-28

---

## 1. 페이지 개요

### 1.1 목적

- 현재 구독 상태 및 정보 조회
- Pro 구독 신청 (토스페이먼츠 빌링키 자동결제)
- 구독 취소 및 재개 관리

### 1.2 목표

- 구독 상태를 명확하게 표시하여 사용자 혼란 방지
- 토스페이먼츠 SDK를 안전하게 통합하여 원활한 결제 경험 제공
- 4가지 구독 상태(무료, Pro 활성, Pro 취소 예약, 결제 실패)를 정확히 구분하여 처리
- 취소 예약 시 다음 결제일까지 혜택 유지 안내
- 모바일 친화적인 반응형 UI

### 1.3 사용자 플로우

```
1. 구독 관리 페이지 접근
   ↓
2. 현재 구독 상태 조회 및 표시
   ↓
3-A. 무료 사용자
   → "Pro 구독하기" 버튼 클릭
   → 토스페이먼츠 카드 등록창
   → 본인인증
   → authKey 수신
   → 서버에서 빌링키 발급
   → 첫 결제 (9,900원)
   → 구독 성공 → 구독 관리 페이지로 리다이렉트
   → Pro 구독 상태 표시

3-B. Pro 구독자 (활성)
   → "구독 취소" 버튼 클릭
   → 취소 확인 다이얼로그
   → 구독 상태 '취소 예약'으로 변경
   → 다음 결제일까지 Pro 혜택 유지 안내
   → "구독 재개" 버튼 표시

3-C. Pro 구독자 (취소 예약)
   → "구독 재개" 버튼 클릭
   → 재개 확인 다이얼로그
   → 구독 상태 '활성'으로 변경
   → 다음 결제일 자동 결제 안내
   → "구독 취소" 버튼 표시

3-D. Pro 구독자 (결제 실패)
   → 결제 실패 안내 메시지
   → "결제 재시도" 버튼 (또는 새 카드 등록)
   → 카드 정보 업데이트
```

---

## 2. 데이터베이스 의존성

### 2.1 사용하는 테이블

**users**
- `id` (Clerk user ID)
- `email`
- `name`
- `subscription_status` ('free' | 'pro' | 'cancelled' | 'payment_failed')
- `test_count`

**subscriptions** (Pro 구독자만)
- `id`
- `user_id`
- `billing_key` (토스페이먼츠 빌링키)
- `customer_key` (UUID)
- `card_number` (마지막 4자리)
- `card_type` (체크/신용)
- `card_company`
- `status` ('active' | 'cancelled' | 'terminated' | 'payment_failed')
- `next_billing_date`
- `last_billing_date`
- `created_at`

**payments** (결제 내역)
- `id`
- `user_id`
- `subscription_id`
- `payment_key`
- `order_id`
- `amount`
- `status` ('done' | 'cancelled' | 'failed')
- `paid_at`

### 2.2 필요한 쿼리

1. **구독 정보 조회**
```typescript
// users + subscriptions JOIN
SELECT
  u.email,
  u.name,
  u.subscription_status,
  u.test_count,
  s.next_billing_date,
  s.card_number,
  s.card_company,
  s.created_at AS subscription_start_date
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.id = ?
```

2. **구독 취소**
```typescript
// subscriptions 테이블
UPDATE subscriptions
SET status = 'cancelled'
WHERE user_id = ?

// users 테이블
UPDATE users
SET subscription_status = 'cancelled'
WHERE id = ?
```

3. **구독 재개**
```typescript
// subscriptions 테이블
UPDATE subscriptions
SET status = 'active'
WHERE user_id = ?

// users 테이블
UPDATE users
SET subscription_status = 'pro'
WHERE id = ?
```

---

## 3. 구독 상태별 UI 렌더링

### 3.1 무료 사용자 (`subscription_status === 'free'`)

**표시 정보:**
- 이메일 주소
- 현재 요금제: 무료
- 잔여 검사 횟수: X회 (초기 3회, 소진 후 0회)
- 다음 결제일: 없음
- 카드 정보: 없음

**액션 버튼:**
- "Pro 구독하기" (Primary 버튼, 파란색)

**안내 메시지:**
```
무료 요금제를 사용 중입니다.
Pro 구독으로 월 10회 고급 분석을 이용하세요!
```

---

### 3.2 Pro 구독자 - 활성 (`subscription_status === 'pro'`)

**표시 정보:**
- 이메일 주소
- 현재 요금제: Pro
- 잔여 검사 횟수: X회 / 월 10회
- 다음 결제일: YYYY년 MM월 DD일
- 구독 시작일: YYYY년 MM월 DD일
- 카드 정보: {카드사} ({카드타입}) **** **** **** 1234

**액션 버튼:**
- "구독 취소" (Destructive 버튼, 빨간색)

**안내 메시지:**
```
Pro 구독이 활성화되어 있습니다.
다음 결제일에 자동으로 9,900원이 결제됩니다.
```

---

### 3.3 Pro 구독자 - 취소 예약 (`subscription_status === 'cancelled'`)

**표시 정보:**
- 이메일 주소
- 현재 요금제: Pro (취소 예약)
- 잔여 검사 횟수: X회 / 월 10회
- 다음 결제일: YYYY년 MM월 DD일 (해지 예정)
- 구독 시작일: YYYY년 MM월 DD일
- 카드 정보: {카드사} ({카드타입}) **** **** **** 1234

**액션 버튼:**
- "구독 재개" (Primary 버튼, 파란색)

**안내 메시지:**
```
구독이 취소 예약되었습니다.
YYYY년 MM월 DD일까지 Pro 혜택이 유지됩니다.
다음 결제일 전까지 언제든지 구독을 재개할 수 있습니다.
```

**배지:**
- "취소 예약" (오렌지색 배지)

---

### 3.4 Pro 구독자 - 결제 실패 (`subscription_status === 'payment_failed'`)

**표시 정보:**
- 이메일 주소
- 현재 요금제: Pro (결제 실패)
- 잔여 검사 횟수: X회 / 월 10회
- 마지막 결제 시도일: YYYY년 MM월 DD일
- 구독 시작일: YYYY년 MM월 DD일
- 카드 정보: {카드사} ({카드타입}) **** **** **** 1234

**액션 버튼:**
- "결제 재시도" (Primary 버튼, 파란색)

**안내 메시지:**
```
결제에 실패했습니다.
카드 한도 초과 또는 잔액 부족일 수 있습니다.
3일 후 자동으로 재시도되며, 실패 시 구독이 자동 해지됩니다.
```

**배지:**
- "결제 실패" (빨간색 배지)

---

## 4. Pro 구독 신청 플로우 (토스페이먼츠)

### 4.1 플로우 개요

```
1. "Pro 구독하기" 버튼 클릭
   ↓
2. customerKey 생성 (UUID)
   ↓
3. 토스페이먼츠 SDK 초기화
   ↓
4. requestBillingAuth() 호출
   ↓
5. 카드 정보 입력 및 본인인증 (SDK UI)
   ↓
6. authKey 수신
   ↓
7. 성공 페이지로 리다이렉트 (/subscription/success?authKey=xxx&customerKey=xxx)
   ↓
8. 서버 API 호출 (/api/subscription/confirm)
   - authKey로 빌링키 발급
   - Supabase subscriptions 테이블에 저장
   - 첫 결제 진행 (9,900원)
   - 결제 성공 시 payments 테이블에 저장
   - users.subscription_status → 'pro'
   - users.test_count → 10
   ↓
9. 구독 관리 페이지로 리다이렉트 (/subscription)
   ↓
10. Pro 구독 상태 표시
```

### 4.2 SDK 초기화 및 카드 등록

**파일 위치**: `/subscription` 페이지 (Client Component)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { v4 as uuidv4 } from 'uuid';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

// 컴포넌트 내
const [payment, setPayment] = useState<any>(null);
const customerKey = uuidv4(); // UUID 생성

useEffect(() => {
  async function initPayment() {
    const tossPayments = await loadTossPayments(clientKey);
    const payment = tossPayments.payment({ customerKey });
    setPayment(payment);
  }
  initPayment();
}, []);

async function handleSubscribe() {
  if (!payment) return;

  // customerKey를 세션에 임시 저장 (성공 페이지에서 사용)
  sessionStorage.setItem('customerKey', customerKey);

  await payment.requestBillingAuth({
    method: 'CARD',
    successUrl: `${window.location.origin}/subscription/success`,
    failUrl: `${window.location.origin}/subscription/fail`,
    customerEmail: user.email,
    customerName: user.name,
  });
}
```

### 4.3 빌링키 발급 및 첫 결제

**파일 위치**: `/api/subscription/confirm/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { serverEnv } from '@/constants/server-env';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { authKey, customerKey } = await request.json();

  // 1. 빌링키 발급
  const encodedKey = Buffer.from(`${serverEnv.TOSS_SECRET_KEY}:`).toString('base64');

  const response = await fetch(
    'https://api.tosspayments.com/v1/billing/authorizations/issue',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authKey, customerKey }),
    }
  );

  const billingData = await response.json();

  // 2. Supabase에 구독 정보 저장
  const supabase = createAdminClient();

  await supabase.from('subscriptions').insert({
    user_id: userId,
    billing_key: billingData.billingKey,
    customer_key: customerKey,
    card_number: billingData.card?.number?.slice(-4),
    card_type: billingData.card?.cardType,
    card_company: billingData.card?.issuerCode,
    status: 'active',
    next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // 3. 첫 결제 진행
  const chargeResponse = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/subscription/charge`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billingKey: billingData.billingKey,
        customerKey,
        amount: 9900,
        userId,
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

  // 4. users 테이블 업데이트
  await supabase.from('users').update({
    subscription_status: 'pro',
    test_count: 10,
  }).eq('id', userId);

  return NextResponse.json({ success: true });
}
```

### 4.4 에러 처리

**빌링키 발급 실패:**
- 에러 메시지: "카드 등록에 실패했습니다. {상세 오류 내용}"
- 재시도 버튼 제공
- 고객센터 안내 (토스페이먼츠 1544-7772)

**첫 결제 실패:**
- 빌링키 삭제 (DB)
- 에러 메시지: "결제에 실패했습니다. 카드 한도를 확인해주세요."
- 다른 카드로 다시 시도 안내

**카드 정보 오류:**
- 토스페이먼츠 SDK 자체 에러 메시지 표시
- 재입력 유도

**본인인증 실패:**
- 에러 메시지: "본인인증에 실패했습니다. 다시 시도해주세요."
- 재시도 버튼

---

## 5. 구독 취소 플로우

### 5.1 플로우 개요

```
1. "구독 취소" 버튼 클릭
   ↓
2. 확인 다이얼로그 표시
   - 제목: "구독을 취소하시겠습니까?"
   - 메시지: "다음 결제일(YYYY-MM-DD)까지 Pro 혜택이 유지됩니다."
   - 안내: "다음 결제일 전까지 언제든지 구독을 재개할 수 있습니다."
   - 버튼: "취소", "확인"
   ↓
3. 사용자가 "확인" 클릭
   ↓
4. Server Action 호출 (cancelSubscription)
   - subscriptions.status → 'cancelled'
   - users.subscription_status → 'cancelled'
   ↓
5. 페이지 리로드 또는 상태 업데이트
   ↓
6. 구독 상태: Pro (취소 예약) 표시
   - "구독 재개" 버튼 표시
   - 다음 결제일까지 혜택 유지 안내
```

### 5.2 Server Action

**파일 위치**: `/features/subscription/actions/cancel-subscription.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function cancelSubscription() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다.' };
  }

  const supabase = await createClient();

  // 1. subscriptions 테이블 업데이트
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId);

  if (subError) {
    console.error('구독 취소 실패:', subError);
    return { success: false, error: '구독 취소에 실패했습니다.' };
  }

  // 2. users 테이블 업데이트
  const { error: userError } = await supabase
    .from('users')
    .update({ subscription_status: 'cancelled' })
    .eq('id', userId);

  if (userError) {
    console.error('사용자 상태 업데이트 실패:', userError);
    return { success: false, error: '구독 취소에 실패했습니다.' };
  }

  return { success: true };
}
```

### 5.3 다이얼로그 UI

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// 컴포넌트 내
<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>구독을 취소하시겠습니까?</AlertDialogTitle>
      <AlertDialogDescription>
        다음 결제일({formatDate(nextBillingDate)})까지 Pro 혜택이 유지됩니다.
        <br />
        다음 결제일 전까지 언제든지 구독을 재개할 수 있습니다.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction onClick={handleCancel}>확인</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 6. 구독 재개 플로우

### 6.1 플로우 개요

```
1. "구독 재개" 버튼 클릭
   ↓
2. 확인 다이얼로그 표시
   - 제목: "구독을 재개하시겠습니까?"
   - 메시지: "다음 결제일(YYYY-MM-DD)에 자동 결제가 진행됩니다."
   - 버튼: "취소", "확인"
   ↓
3. 사용자가 "확인" 클릭
   ↓
4. Server Action 호출 (resumeSubscription)
   - subscriptions.status → 'active'
   - users.subscription_status → 'pro'
   ↓
5. 페이지 리로드 또는 상태 업데이트
   ↓
6. 구독 상태: Pro (활성) 표시
   - "구독 취소" 버튼 표시
   - 다음 결제일 자동 결제 안내
```

### 6.2 Server Action

**파일 위치**: `/features/subscription/actions/resume-subscription.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function resumeSubscription() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다.' };
  }

  const supabase = await createClient();

  // 1. subscriptions 테이블 업데이트
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('user_id', userId);

  if (subError) {
    console.error('구독 재개 실패:', subError);
    return { success: false, error: '구독 재개에 실패했습니다.' };
  }

  // 2. users 테이블 업데이트
  const { error: userError } = await supabase
    .from('users')
    .update({ subscription_status: 'pro' })
    .eq('id', userId);

  if (userError) {
    console.error('사용자 상태 업데이트 실패:', userError);
    return { success: false, error: '구독 재개에 실패했습니다.' };
  }

  return { success: true };
}
```

---

## 7. 구독 상태 실시간 업데이트

### 7.1 상태 관리

**방법 1: 페이지 리로드 (권장)**
- 구독 취소/재개 후 `router.refresh()` 호출
- 서버 컴포넌트가 최신 데이터 다시 페칭
- 간단하고 확실함

**방법 2: Optimistic UI**
- 클라이언트 상태를 먼저 업데이트
- Server Action 완료 후 실제 데이터 확인
- 더 나은 UX, 복잡도 증가

**권장**: 방법 1 사용 (간단하고 오류 가능성 낮음)

### 7.2 구현 예시 (방법 1)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { cancelSubscription } from '@/features/subscription/actions/cancel-subscription';
import { useToast } from '@/hooks/use-toast';

const router = useRouter();
const { toast } = useToast();

async function handleCancel() {
  const result = await cancelSubscription();

  if (result.success) {
    toast({
      title: '구독이 취소 예약되었습니다',
      description: '다음 결제일까지 Pro 혜택이 유지됩니다.',
    });
    router.refresh(); // 페이지 리로드
  } else {
    toast({
      variant: 'destructive',
      title: '구독 취소 실패',
      description: result.error,
    });
  }
}
```

---

## 8. 컴포넌트 구조 및 파일 구조

### 8.1 페이지 구조

```
app/
└── subscription/
    ├── page.tsx (Server Component)
    ├── components/
    │   ├── subscription-info.tsx (Server Component)
    │   ├── subscription-actions.tsx (Client Component)
    │   ├── subscribe-button.tsx (Client Component)
    │   ├── cancel-dialog.tsx (Client Component)
    │   └── resume-dialog.tsx (Client Component)
    ├── success/
    │   └── page.tsx (Client Component)
    └── fail/
        └── page.tsx (Client Component)
```

### 8.2 주요 컴포넌트

**1. page.tsx (Server Component)**
- 구독 정보 조회 (getSubscription)
- 레이아웃 렌더링
- SubscriptionInfo, SubscriptionActions 조합

**2. subscription-info.tsx (Server Component)**
- 현재 구독 정보 표시
- 이메일, 요금제, 잔여 횟수, 다음 결제일, 카드 정보

**3. subscription-actions.tsx (Client Component)**
- 구독 상태에 따른 액션 버튼 렌더링
- 무료: SubscribeButton
- Pro 활성: CancelDialog
- Pro 취소 예약: ResumeDialog
- 결제 실패: 재시도 버튼

**4. subscribe-button.tsx (Client Component)**
- 토스페이먼츠 SDK 초기화
- 카드 등록 요청
- 로딩 상태 관리

**5. cancel-dialog.tsx (Client Component)**
- 구독 취소 확인 다이얼로그
- cancelSubscription 호출
- 성공 시 페이지 리로드

**6. resume-dialog.tsx (Client Component)**
- 구독 재개 확인 다이얼로그
- resumeSubscription 호출
- 성공 시 페이지 리로드

### 8.3 Features 구조

```
src/
└── features/
    └── subscription/
        ├── actions/
        │   ├── cancel-subscription.ts
        │   └── resume-subscription.ts
        ├── queries/
        │   └── get-subscription.ts
        └── types/
            └── subscription.ts
```

---

## 9. 토스페이먼츠 SDK 통합

### 9.1 SDK 로드 및 초기화

**파일 위치**: `src/lib/tosspayments/client.ts`

```typescript
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

### 9.2 환경 변수

**.env.local**
```bash
# 토스페이먼츠 클라이언트 키 (Public)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm

# 토스페이먼츠 시크릿 키 (Server Only)
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6

# Base URL (결제 리다이렉트용)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cron Job 인증 (Server Only)
CRON_SECRET=your-secure-random-string
```

### 9.3 SDK 사용 예시

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createPayment } from '@/lib/tosspayments/client';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs';

export function SubscribeButton() {
  const { user } = useUser();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const customerKey = uuidv4();

  useEffect(() => {
    async function init() {
      const p = await createPayment(customerKey);
      setPayment(p);
    }
    init();
  }, [customerKey]);

  async function handleSubscribe() {
    if (!payment || !user) return;

    setLoading(true);
    sessionStorage.setItem('customerKey', customerKey);

    try {
      await payment.requestBillingAuth({
        method: 'CARD',
        successUrl: `${window.location.origin}/subscription/success`,
        failUrl: `${window.location.origin}/subscription/fail`,
        customerEmail: user.primaryEmailAddress?.emailAddress || '',
        customerName: user.fullName || '',
      });
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        console.log('사용자가 결제창을 닫았습니다.');
      } else {
        console.error('카드 등록 실패:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={!payment || loading}
      className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
    >
      {loading ? '처리 중...' : 'Pro 구독하기'}
    </button>
  );
}
```

---

## 10. 성능 및 보안 고려사항

### 10.1 성능

**서버 컴포넌트 활용:**
- 구독 정보 조회는 서버 컴포넌트에서 수행
- 클라이언트 번들 크기 최소화

**토스페이먼츠 SDK 로딩 최적화:**
- 전역에서 한 번만 로드 (싱글톤 패턴)
- 필요한 페이지에서만 로드

**데이터 캐싱:**
- 구독 정보는 자주 변경되지 않으므로 캐싱 가능
- Next.js 자동 캐싱 활용

### 10.2 보안

**빌링키 보안:**
- 빌링키는 절대 클라이언트에 노출 금지
- 서버에서만 사용
- 로그에 노출 금지
- 암호화 저장 권장 (Supabase Vault)

**customerKey 보안:**
- UUID 사용 (유추 불가능)
- 이메일, 전화번호 사용 금지
- 다른 사용자가 알 수 없도록 관리

**시크릿 키 보안:**
- 환경 변수로 관리
- GitHub 커밋 금지
- 클라이언트 노출 절대 금지

**API 엔드포인트 보안:**
- Clerk 인증 필수
- 사용자 ID 검증
- CSRF 방지 (Next.js 자동 처리)

**금액 검증:**
- 클라이언트와 서버에서 모두 금액 확인
- 9,900원 고정값 사용

---

## 11. 접근성 요구사항

### 11.1 키보드 네비게이션

- 모든 버튼과 다이얼로그는 Tab 키로 접근 가능
- Enter/Space 키로 버튼 활성화
- Esc 키로 다이얼로그 닫기

### 11.2 스크린 리더 지원

- ARIA 라벨 명시
- role 속성 적절히 사용
- 에러 메시지에 aria-live 적용
- 로딩 상태 aria-busy 표시

### 11.3 색상 대비

- WCAG AA 기준 준수
- 텍스트와 배경 대비 4.5:1 이상
- 상태 표시에 색상 외 텍스트도 병행

### 11.4 포커스 표시

- 포커스 상태 명확히 표시
- 키보드 네비게이션 시 현재 위치 인지 가능

---

## 12. 모바일 친화적 디자인

### 12.1 반응형 레이아웃

- 320px 이상 모든 화면 크기 지원
- 모바일: 1 column
- 태블릿: 1-2 column
- 데스크톱: 2 column

### 12.2 터치 친화적 UI

- 버튼 크기: 최소 44x44px
- 충분한 간격 (16px 이상)
- 터치 영역 명확히 구분

### 12.3 토스페이먼츠 SDK 모바일 대응

- SDK가 자동으로 모바일 최적화 UI 제공
- 본인인증도 모바일 친화적

---

## 13. 에러 처리 및 사용자 피드백

### 13.1 에러 메시지

**빌링키 발급 실패:**
```
제목: 카드 등록 실패
내용: 카드 정보가 올바르지 않거나, 본인인증에 실패했습니다. 다시 시도해주세요.
액션: "재시도" 버튼
```

**첫 결제 실패:**
```
제목: 결제 실패
내용: 카드 한도 초과 또는 잔액 부족입니다. 다른 카드를 사용해주세요.
액션: "다시 시도" 버튼
```

**구독 취소 실패:**
```
제목: 구독 취소 실패
내용: 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
액션: "재시도" 버튼
```

**구독 재개 실패:**
```
제목: 구독 재개 실패
내용: 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
액션: "재시도" 버튼
```

**네트워크 에러:**
```
제목: 네트워크 오류
내용: 인터넷 연결을 확인해주세요.
액션: "재시도" 버튼
```

### 13.2 성공 메시지

**구독 성공:**
```
제목: 구독 완료
내용: Pro 구독이 성공적으로 등록되었습니다. 월 10회 고급 분석을 이용하세요!
```

**구독 취소 성공:**
```
제목: 구독 취소 예약 완료
내용: 다음 결제일까지 Pro 혜택이 유지됩니다.
```

**구독 재개 성공:**
```
제목: 구독 재개 완료
내용: 다음 결제일에 자동 결제가 진행됩니다.
```

### 13.3 로딩 상태

- 버튼 클릭 시 로딩 스피너 표시
- 버튼 비활성화
- 로딩 텍스트 변경 ("처리 중...")
- 전체 페이지 로딩: 스켈레톤 UI

---

## 14. 테스트 시나리오

### 14.1 무료 사용자 → Pro 구독

**단계:**
1. 무료 사용자로 로그인
2. 구독 관리 페이지 접근
3. "Pro 구독하기" 버튼 클릭
4. 토스페이먼츠 결제창에서 카드 정보 입력
   - 카드번호: 실제 카드번호 (테스트 환경)
   - 유효기간: 미래 날짜
   - CVC: 임의 3자리
   - 비밀번호: 임의 2자리
   - 생년월일: YYMMDD
   - 본인인증: 000000
5. 빌링키 발급 성공 확인
6. 첫 결제 성공 확인 (9,900원)
7. 구독 관리 페이지로 리다이렉트
8. Pro 구독 상태 확인
9. 잔여 횟수 10회 확인

**예상 결과:**
- 구독 상태: Pro (활성)
- 잔여 횟수: 10회
- 다음 결제일: 30일 후
- "구독 취소" 버튼 표시

---

### 14.2 Pro 구독자 → 구독 취소

**단계:**
1. Pro 구독자로 로그인
2. 구독 관리 페이지 접근
3. "구독 취소" 버튼 클릭
4. 확인 다이얼로그에서 "확인" 클릭
5. 페이지 리로드

**예상 결과:**
- 구독 상태: Pro (취소 예약)
- 잔여 횟수: 유지
- 다음 결제일: 해지 예정일 표시
- "구독 재개" 버튼 표시
- 안내 메시지: "다음 결제일까지 Pro 혜택이 유지됩니다."

---

### 14.3 Pro 구독자 (취소 예약) → 구독 재개

**단계:**
1. Pro 구독자 (취소 예약) 로그인
2. 구독 관리 페이지 접근
3. "구독 재개" 버튼 클릭
4. 확인 다이얼로그에서 "확인" 클릭
5. 페이지 리로드

**예상 결과:**
- 구독 상태: Pro (활성)
- 잔여 횟수: 유지
- 다음 결제일: 자동 결제 예정
- "구독 취소" 버튼 표시
- 안내 메시지: "다음 결제일에 자동 결제가 진행됩니다."

---

### 14.4 에러 시나리오

**카드 정보 오류:**
- 잘못된 카드번호 입력
- 토스페이먼츠 SDK 에러 메시지 표시
- 재입력 유도

**첫 결제 실패:**
- 한도 초과 카드 사용
- 빌링키 자동 삭제
- 에러 메시지 표시
- 다른 카드로 재시도 안내

**네트워크 에러:**
- 인터넷 연결 끊김
- 에러 메시지 표시
- 재시도 버튼 제공

---

## 15. 구현 체크리스트

### 15.1 데이터베이스

- [ ] subscriptions 테이블 생성 확인
- [ ] payments 테이블 생성 확인
- [ ] users 테이블에 구독 필드 추가 확인
- [ ] RLS 정책 적용 확인
- [ ] Cron Job 등록 확인

### 15.2 환경 변수

- [ ] TOSS_SECRET_KEY 추가
- [ ] NEXT_PUBLIC_TOSS_CLIENT_KEY 추가
- [ ] CRON_SECRET 추가
- [ ] NEXT_PUBLIC_BASE_URL 추가

### 15.3 토스페이먼츠 SDK

- [ ] SDK 패키지 설치 확인
- [ ] SDK 초기화 코드 작성
- [ ] 카드 등록 UI 구현
- [ ] 빌링키 발급 API 구현
- [ ] 자동결제 승인 API 구현

### 15.4 Server Actions

- [ ] cancelSubscription 구현
- [ ] resumeSubscription 구현
- [ ] getSubscription 구현

### 15.5 UI 컴포넌트

- [ ] 구독 정보 표시 컴포넌트
- [ ] 구독 액션 버튼 컴포넌트
- [ ] 구독하기 버튼 (SDK 통합)
- [ ] 취소 확인 다이얼로그
- [ ] 재개 확인 다이얼로그
- [ ] 로딩 상태 처리
- [ ] 에러 메시지 토스트

### 15.6 페이지

- [ ] /subscription 페이지 구현
- [ ] /subscription/success 페이지 구현
- [ ] /subscription/fail 페이지 구현

### 15.7 테스트

- [ ] 무료 → Pro 구독 플로우 테스트
- [ ] Pro 구독 취소 플로우 테스트
- [ ] Pro 구독 재개 플로우 테스트
- [ ] 에러 시나리오 테스트
- [ ] 모바일 반응형 테스트
- [ ] 접근성 테스트

---

## 16. 참고 문서

- [PRD 문서](/Users/leo/awesomedev/vmc1/vibe-fortune/docs/prd.md)
- [요구사항 문서](/Users/leo/awesomedev/vmc1/vibe-fortune/docs/requirement.md)
- [Userflow 문서](/Users/leo/awesomedev/vmc1/vibe-fortune/docs/userflow.md)
- [데이터베이스 설계 문서](/Users/leo/awesomedev/vmc1/vibe-fortune/docs/database.md)
- [토스페이먼츠 연동 가이드](/Users/leo/awesomedev/vmc1/vibe-fortune/docs/external/tosspayments.md)
- [공통 모듈 문서](/Users/leo/awesomedev/vmc1/vibe-fortune/docs/common-modules.md)

---

## 17. 예상 일정

| 작업 단계 | 예상 시간 | 설명 |
|---------|---------|------|
| 데이터베이스 마이그레이션 | 30분 | subscriptions, payments 테이블 생성 |
| 환경 변수 설정 | 10분 | 토스페이먼츠 키 추가 |
| 토스페이먼츠 SDK 통합 | 1시간 | SDK 초기화, 카드 등록 UI |
| 빌링키 발급 API | 1시간 | 빌링키 발급, 첫 결제 |
| Server Actions 구현 | 1시간 | 취소/재개 로직 |
| UI 컴포넌트 구현 | 2시간 | 구독 정보, 액션 버튼, 다이얼로그 |
| 페이지 구현 | 1시간 | 메인, 성공, 실패 페이지 |
| 테스트 및 버그 수정 | 2시간 | 전체 플로우 테스트 |
| **총 예상 시간** | **8.5시간** | 약 1일 작업량 |

---

## 18. 주의사항

### 18.1 결제 정보 보안

- 빌링키는 절대 클라이언트에 노출 금지
- 로그에 빌링키, 카드번호 전체 노출 금지
- customerKey는 UUID 사용 (유추 불가능)

### 18.2 구독 정책

- 무료 사용자: 초기 3회만 제공 (소진 후 0회)
- Pro 구독자: 월 10회 (매월 갱신)
- 구독 취소 시 다음 결제일까지 Pro 혜택 유지
- 다음 결제일 도달 시 자동 해지 (Cron Job)

### 18.3 토스페이먼츠 계약

- 자동결제는 추가 계약 필요
- 고객센터: 1544-7772
- 계약 완료 후 라이브 키 발급

### 18.4 테스트 환경

- 테스트 키로 테스트 시 실제 결제 없음
- 본인인증: 000000 입력
- 실제 카드번호 사용 가능 (앞 6자리만 유효해도 OK)

### 18.5 에러 처리

- 모든 에러는 사용자 친화적 메시지로 변환
- 재시도 버튼 제공
- 로그로 상세 에러 기록

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-28 | Claude Code | 초안 작성 |
