/**
 * 구독 취소 Server Action
 *
 * 사용자의 Pro 구독을 취소 예약합니다.
 * 구독은 즉시 해지되지 않고, 다음 결제일까지 Pro 혜택이 유지됩니다.
 *
 * @returns success: 성공 여부, error: 에러 메시지
 */

'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function cancelSubscription() {
  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = await createClient();

    // 2. 활성 구독 확인
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return { success: false, error: '활성화된 구독을 찾을 수 없습니다.' };
    }

    if (subscription.status !== 'active') {
      return { success: false, error: '취소할 수 있는 구독이 아닙니다.' };
    }

    // 3. 구독 상태를 cancelled로 변경
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId);

    if (subError) {
      console.error('구독 취소 실패:', subError);
      throw subError;
    }

    // 4. users 테이블 업데이트
    const { error: userError } = await supabase
      .from('users')
      .update({ subscription_status: 'cancelled' })
      .eq('id', userId);

    if (userError) {
      console.error('사용자 정보 업데이트 실패:', userError);
      throw userError;
    }

    console.log('구독 취소 완료:', { userId });

    return { success: true };
  } catch (error: any) {
    console.error('구독 취소 실패:', error);
    return { success: false, error: '구독 취소에 실패했습니다.' };
  }
}
