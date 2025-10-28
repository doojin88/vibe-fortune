/**
 * 사주분석 삭제 Server Action
 *
 * 사용자가 자신의 사주분석 결과를 삭제할 수 있습니다.
 * 삭제 후 대시보드로 리다이렉트됩니다.
 */

'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function deleteSajuTest(testId: string) {
  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = await createClient();

    // 2. 사주분석 존재 여부 및 소유권 확인
    const { data: sajuTest, error: fetchError } = await supabase
      .from('saju_tests')
      .select('id, user_id')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !sajuTest) {
      return { success: false, error: '사주분석을 찾을 수 없습니다.' };
    }

    // 3. 사주분석 삭제
    const { error: deleteError } = await supabase
      .from('saju_tests')
      .delete()
      .eq('id', testId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('사주분석 삭제 실패:', deleteError);
      return { success: false, error: '사주분석 삭제에 실패했습니다.' };
    }

    console.log('사주분석 삭제 완료:', { testId, userId });

    // 4. 성공 반환 (리다이렉트는 컴포넌트에서 처리)
    return { success: true };
  } catch (error: any) {
    console.error('사주분석 삭제 실패:', error);
    return { success: false, error: '사주분석 삭제에 실패했습니다.' };
  }
}
