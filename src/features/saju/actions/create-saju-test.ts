'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server-client';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { auth, currentUser } from '@clerk/nextjs/server';
import { geminiClient } from '@/lib/gemini/client';
import { generateSajuPrompt } from '@/lib/gemini/prompts';
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

    // 3. 사용자 정보 생성 또는 확인
    const adminSupabase = createAdminClient();
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      // 사용자 정보 가져오기
      const user = await currentUser();
      if (!user) {
        return { success: false, error: '사용자 정보를 가져올 수 없습니다' };
      }

      const email = user.emailAddresses[0]?.emailAddress || '';
      const name = [user.lastName, user.firstName].filter(Boolean).join('') || 
                  email.split('@')[0] || 'Unknown';

      // 사용자 생성
      const { error: userError } = await adminSupabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
        } as any);

      if (userError) {
        console.error('사용자 생성 실패:', userError);
        return { success: false, error: '사용자 정보 생성에 실패했습니다' };
      }
    }

    // 4. AI 프롬프트 생성
    const prompt = generateSajuPrompt(validatedInput);

    // 5. Gemini API 호출
    const { text: result } = await geminiClient.generateContent(prompt);

    // 6. 데이터베이스 저장
    const { data: sajuTest, error: dbError } = await adminSupabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: validatedInput.name,
        birth_date: validatedInput.birthDate,
        birth_time: validatedInput.birthTime || null,
        gender: validatedInput.gender,
        result,
      } as any)
      .select()
      .single();

    if (dbError || !sajuTest) {
      console.error('데이터베이스 저장 실패:', dbError);
      return { success: false, error: '분석 결과 저장에 실패했습니다' };
    }

    // 7. 상세 페이지로 리다이렉트 (redirect는 정상적인 동작이므로 catch하지 않음)
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
