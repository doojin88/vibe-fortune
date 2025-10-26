import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';
import type { SajuTestListItem } from '@/features/saju/types/result';
import 'server-only';

export async function getSajuTests(limit = 10): Promise<SajuTestListItem[]> {
  const { userId } = await auth();
  
  if (!userId) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('saju_tests')
    .select('id, name, birth_date, gender, result, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('사주분석 목록 조회 실패:', error);
    return [];
  }

  return data.map((test) => ({
    id: test.id,
    name: test.name,
    birthDate: test.birth_date,
    gender: test.gender as 'male' | 'female',
    createdAt: test.created_at,
    preview: test.result.slice(0, 100) + '...',
  }));
}
