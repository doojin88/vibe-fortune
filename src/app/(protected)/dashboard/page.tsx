import type { Metadata } from 'next';
import Link from 'next/link';
import { getSajuTests } from '@/features/saju/queries/get-saju-tests';
import { DashboardContent } from '@/features/saju/components/dashboard-content';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '내 사주분석 이력 | Vibe Fortune',
  description: '과거 사주분석 결과를 확인하고 새로운 분석을 시작하세요',
};

export default async function DashboardPage() {
  const tests = await getSajuTests();

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">내 사주분석 이력</h1>
          <p className="text-muted-foreground mt-1">
            과거 사주분석 결과를 확인하고 새로운 분석을 시작하세요
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button>새 검사하기</Button>
        </Link>
      </div>

      {/* 메인 컨텐츠 (Client Component) */}
      <DashboardContent initialTests={tests} />
    </div>
  );
}
