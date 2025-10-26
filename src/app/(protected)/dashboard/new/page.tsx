import { NewAnalysisForm } from '@/features/saju/components/new-analysis-form';

export default function NewAnalysisPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">새 사주분석</h1>
          <p className="text-muted-foreground mt-2">
            분석하실 분의 정보를 입력해주세요
          </p>
        </div>
        <NewAnalysisForm />
      </div>
    </div>
  );
}
