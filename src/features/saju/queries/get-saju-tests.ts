import { createClient } from '@/lib/supabase/server-client';
import type { SajuTestListItem } from '@/features/saju/types/result';
import 'server-only';

export async function getSajuTests(limit = 10): Promise<SajuTestListItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('saju_tests')
    .select('id, name, birth_date, gender, result, created_at')
    .eq('user_id', user.id)
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
