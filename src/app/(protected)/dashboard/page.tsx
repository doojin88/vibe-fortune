import type { Metadata } from 'next';
import Link from 'next/link';
import { getSajuTests } from '@/features/saju/queries/get-saju-tests';
import { SajuTestCard } from '@/features/saju/components/saju-test-card';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export const metadata: Metadata = {
  title: '내 사주분석 이력 | Vibe Fortune',
  description: '과거 사주분석 결과를 확인하고 새로운 분석을 시작하세요',
};

export default async function DashboardPage() {
  const tests = await getSajuTests();

  return (
    <div className="container py-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">내 사주분석 이력</h1>
        <Link href="/dashboard/new">
          <Button>새 검사하기</Button>
        </Link>
      </div>

      {/* 메인 컨텐츠 */}
      {tests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <SajuTestCard key={test.id} test={test} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">아직 사주분석 이력이 없습니다</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            첫 사주분석을 시작해보세요
          </p>
          <Link href="/dashboard/new">
            <Button>첫 검사 시작하기</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
