'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server-client';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { auth, currentUser } from '@clerk/nextjs/server';
import { geminiClient } from '@/lib/gemini/client';
import { generateSajuPrompt, generateProSajuPrompt } from '@/lib/gemini/prompts';
import { sajuInputSchema, type SajuInput } from '@/features/saju/types/input';

export type CreateSajuTestResult =
  | { success: true; testId: string }
  | { success: false; error: string };

export async function createSajuTest(
  input: SajuInput
): Promise<CreateSajuTestResult> {
  try {
    // 1. 입력 검증
    let validatedInput: SajuInput;
    try {
      validatedInput = sajuInputSchema.parse(input);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as any;
        const firstIssue = zodError.issues[0];
        if (firstIssue?.path[0] === 'birthDate') {
          return { success: false, error: '생년월일을 YYYY-MM-DD 형식(예: 2000-01-01)으로 입력해주세요' };
        }
      }
      return { success: false, error: '입력 정보를 확인해주세요' };
    }

    // 2. 사용자 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    // 3. 사용자 정보 생성 또는 확인 (구독 상태 포함)
    const adminSupabase = createAdminClient();
    const { data: existingUser } = await (adminSupabase as any)
      .from('users')
      .select('id, subscription_status, test_count')
      .eq('id', userId)
      .single();

    let userInfo: { id: string; subscription_status: string; test_count: number } | null = existingUser;

    if (!existingUser) {
      // 사용자 정보 가져오기
      const user = await currentUser();
      if (!user) {
        return { success: false, error: '사용자 정보를 가져올 수 없습니다' };
      }

      const email = user.emailAddresses[0]?.emailAddress || '';
      const name = [user.lastName, user.firstName].filter(Boolean).join('') ||
                  email.split('@')[0] || 'Unknown';

      // 사용자 생성 (초기 구독 상태: free, 검사 횟수: 3)
      const { data: newUser, error: userError } = await (adminSupabase as any)
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          subscription_status: 'free',
          test_count: 3,
        })
        .select('id, subscription_status, test_count')
        .single();

      if (userError || !newUser) {
        console.error('사용자 생성 실패:', userError);
        return { success: false, error: '사용자 정보 생성에 실패했습니다' };
      }

      userInfo = newUser;
    }

    // 4. 잔여 횟수 확인
    if (!userInfo || userInfo.test_count <= 0) {
      return {
        success: false,
        error: '검사 횟수가 부족합니다. 구독 페이지로 이동하시겠습니까?',
      };
    }

    // 5. 구독 상태에 따른 모델 선택
    const isPro = userInfo.subscription_status === 'pro' || userInfo.subscription_status === 'cancelled';
    const prompt = isPro
      ? generateProSajuPrompt(validatedInput)
      : generateSajuPrompt(validatedInput);

    // 6. Gemini API 호출
    const { text: result } = await geminiClient.generateContent(prompt);

    // 7. 데이터베이스 저장 (사용 모델 정보 포함)
    const { data: sajuTest, error: dbError } = await (adminSupabase as any)
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: validatedInput.name,
        birth_date: validatedInput.birthDate,
        birth_time: validatedInput.birthTime || null,
        gender: validatedInput.gender,
        result,
        model_used: isPro ? 'pro' : 'flash',
      })
      .select()
      .single();

    if (dbError || !sajuTest) {
      console.error('데이터베이스 저장 실패:', dbError);
      return { success: false, error: '분석 결과 저장에 실패했습니다' };
    }

    // 8. 횟수 차감
    await (adminSupabase as any)
      .from('users')
      .update({ test_count: userInfo.test_count - 1 })
      .eq('id', userId);

    // 9. 상세 페이지로 리다이렉트 (redirect는 정상적인 동작이므로 catch하지 않음)
    redirect(`/dashboard/results/${(sajuTest as any).id}`);
  } catch (error) {
    // redirect()는 NEXT_REDIRECT를 던지므로 정상적인 동작
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // redirect를 다시 던져서 정상 처리
    }

    console.error('사주분석 생성 실패:', error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: '분석 중 오류가 발생했습니다' };
  }
}
