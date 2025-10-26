import { getSajuTest } from '@/features/saju/queries/get-saju-test';
import { notFound } from 'next/navigation';
import { ResultDetailClient } from '@/features/saju/components/result-detail-client';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResultDetailPage({ params }: PageProps) {
  const { id } = await params;

  const sajuTest = await getSajuTest(id);

  if (!sajuTest) {
    notFound();
  }

  return <ResultDetailClient sajuTest={sajuTest} />;
}
