import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';
import type { SajuTestResult } from '@/features/saju/types/result';
import 'server-only';

export async function getSajuTest(
  id: string
): Promise<SajuTestResult | null> {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('saju_tests')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('사주분석 조회 실패:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }

  if (!data) {
    console.error('사주분석 조회 실패: 데이터를 찾을 수 없습니다.');
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    gender: data.gender as 'male' | 'female',
    result: data.result,
    modelUsed: (data.model_used as 'flash' | 'pro') || 'flash',
    createdAt: data.created_at,
  };
}
