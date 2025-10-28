/**
 * 구독 정보 조회 함수
 *
 * 현재 사용자의 구독 상태 및 관련 정보를 조회합니다.
 * 구독 관리 페이지 및 대시보드 사이드바에서 사용됩니다.
 */

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';
import 'server-only';

/**
 * 구독 정보 타입
 */
export type SubscriptionInfo = {
  /** 사용자 이메일 */
  userEmail: string;
  /** 구독 상태 */
  status: 'free' | 'pro' | 'cancelled' | 'payment_failed';
  /** 잔여 검사 횟수 */
  testCount: number;
  /** 다음 결제일 (ISO 8601 형식) */
  nextBillingDate: string | null;
  /** 카드 번호 마지막 4자리 */
  cardNumber: string | null;
  /** 카드사 */
  cardCompany: string | null;
};

/**
 * 현재 사용자의 구독 정보를 조회합니다.
 *
 * @returns 구독 정보 객체 또는 null (인증되지 않은 경우)
 *
 * @example
 * ```typescript
 * const subscription = await getSubscription();
 *
 * if (subscription) {
 *   console.log(subscription.status); // 'pro'
 *   console.log(subscription.testCount); // 10
 *   console.log(subscription.nextBillingDate); // '2025-02-01T00:00:00.000Z'
 * }
 * ```
 */
export async function getSubscription(): Promise<SubscriptionInfo | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();

  // 1. users 테이블에서 기본 정보 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, subscription_status, test_count')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('사용자 정보 조회 실패:', userError);
    return null;
  }

  // 2. Pro 또는 취소 예약 상태인 경우 구독 정보 조회
  if (user.subscription_status === 'pro' || user.subscription_status === 'cancelled') {
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('next_billing_date, card_number, card_company, status')
      .eq('user_id', userId)
      .single();

    if (subError) {
      console.error('구독 정보 조회 실패:', subError);
    }

    return {
      userEmail: user.email,
      status: user.subscription_status,
      testCount: user.test_count,
      nextBillingDate: subscription?.next_billing_date || null,
      cardNumber: subscription?.card_number || null,
      cardCompany: subscription?.card_company || null,
    };
  }

  // 3. 무료 사용자 또는 결제 실패
  return {
    userEmail: user.email,
    status: user.subscription_status,
    testCount: user.test_count,
    nextBillingDate: null,
    cardNumber: null,
    cardCompany: null,
  };
}

/**
 * 잔여 검사 횟수를 확인합니다.
 *
 * @returns 잔여 검사 횟수
 *
 * @example
 * ```typescript
 * const count = await getRemainingTestCount();
 * if (count <= 0) {
 *   console.log('검사 횟수가 부족합니다.');
 * }
 * ```
 */
export async function getRemainingTestCount(): Promise<number> {
  const { userId } = await auth();
  if (!userId) return 0;

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('test_count')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('잔여 횟수 조회 실패:', error);
    return 0;
  }

  return user.test_count;
}

/**
 * 사용자가 Pro 구독자인지 확인합니다.
 *
 * @returns Pro 구독자 여부
 *
 * @example
 * ```typescript
 * const isPro = await isProSubscriber();
 * if (isPro) {
 *   console.log('Pro 전용 기능을 사용할 수 있습니다.');
 * }
 * ```
 */
export async function isProSubscriber(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('구독 상태 조회 실패:', error);
    return false;
  }

  // Pro 또는 취소 예약 상태는 Pro 혜택 유지
  return user.subscription_status === 'pro' || user.subscription_status === 'cancelled';
}
