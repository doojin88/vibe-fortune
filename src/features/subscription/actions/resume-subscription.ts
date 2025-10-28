/**
 * 구독 재개 Server Action
 *
 * 취소 예약된 구독을 재개합니다.
 * 구독이 해지되기 전에만 재개가 가능합니다.
 *
 * @returns success: 성공 여부, error: 에러 메시지
 */

'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function resumeSubscription() {
  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = await createClient();

    // 2. 취소 예약된 구독 확인
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return { success: false, error: '구독을 찾을 수 없습니다.' };
    }

    if (subscription.status !== 'cancelled') {
      return { success: false, error: '재개할 수 있는 구독이 아닙니다.' };
    }

    // 3. 구독 상태를 active로 변경
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('user_id', userId);

    if (subError) {
      console.error('구독 재개 실패:', subError);
      throw subError;
    }

    // 4. users 테이블 업데이트
    const { error: userError } = await supabase
      .from('users')
      .update({ subscription_status: 'pro' })
      .eq('id', userId);

    if (userError) {
      console.error('사용자 정보 업데이트 실패:', userError);
      throw userError;
    }

    console.log('구독 재개 완료:', { userId });

    return { success: true };
  } catch (error: any) {
    console.error('구독 재개 실패:', error);
    return { success: false, error: '구독 재개에 실패했습니다.' };
  }
}
