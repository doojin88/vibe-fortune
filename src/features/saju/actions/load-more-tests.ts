'use server';

import { createClient } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';
import type { SajuTestListItem } from '@/features/saju/types/result';

type LoadMoreTestsResult = {
  success: boolean;
  data?: SajuTestListItem[];
  error?: string;
  hasMore?: boolean;
};

export async function loadMoreTests(offset: number, limit = 10): Promise<LoadMoreTestsResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('analyses')
      .select('id, name, birth_date, gender, analysis_result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('더보기 조회 실패:', error);
      return { success: false, error: error.message };
    }

    const tests: SajuTestListItem[] = data.map((test) => ({
      id: test.id,
      name: test.name,
      birthDate: test.birth_date,
      gender: test.gender as 'male' | 'female',
      createdAt: test.created_at,
      preview: test.analysis_result.slice(0, 100) + '...',
    }));

    return {
      success: true,
      data: tests,
      hasMore: data.length === limit,
    };
  } catch (error) {
    console.error('더보기 실행 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}
