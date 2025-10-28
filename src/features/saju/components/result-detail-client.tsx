'use client';

import { SajuTestResult } from '@/features/saju/types/result';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { AnalysisInfoCard } from './analysis-info-card';
import { AnalysisResultSection } from './analysis-result-section';
import { NavigationButtons } from './navigation-buttons';

type ResultDetailClientProps = {
  sajuTest: SajuTestResult;
};

export function ResultDetailClient({ sajuTest }: ResultDetailClientProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnalysisInfoCard sajuTest={sajuTest} />
          <AnalysisResultSection 
            result={sajuTest.result} 
            modelUsed={sajuTest.modelUsed}
            testId={sajuTest.id}
            testName={sajuTest.name}
          />
          <NavigationButtons />
        </div>
      </main>
    </div>
  );
}
