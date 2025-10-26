'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';
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
    const validatedInput = sajuInputSchema.parse(input);

    // 2. 사용자 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    // 3. AI 프롬프트 생성
    const prompt = generateSajuPrompt(validatedInput);

    // 4. Gemini API 호출
    const { text: result } = await geminiClient.generateContent(prompt);

    // 5. 데이터베이스 저장
    const supabase = await createClient();
    const { data: sajuTest, error: dbError } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: validatedInput.name,
        birth_date: validatedInput.birthDate,
        birth_time: validatedInput.birthTime || null,
        gender: validatedInput.gender,
        result,
      })
      .select()
      .single();

    if (dbError || !sajuTest) {
      console.error('데이터베이스 저장 실패:', dbError);
      return { success: false, error: '분석 결과 저장에 실패했습니다' };
    }

    // 6. 상세 페이지로 리다이렉트
    redirect(`/dashboard/results/${sajuTest.id}`);
  } catch (error) {
    console.error('사주분석 생성 실패:', error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: '분석 중 오류가 발생했습니다' };
  }
}
