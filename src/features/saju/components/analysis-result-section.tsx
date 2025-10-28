'use client';

import { useState } from 'react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Sparkles, Info } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { useToast } from '@/hooks/use-toast';
import { DeleteTestDialog } from './delete-test-dialog';

type AnalysisResultSectionProps = {
  result: string;
  modelUsed: 'flash' | 'pro';
  testId: string;
  testName: string;
};

export function AnalysisResultSection({ result, modelUsed, testId, testName }: AnalysisResultSectionProps) {
  const [copyIcon, setCopyIcon] = useState<'copy' | 'check'>('copy');
  const { toast } = useToast();

  const handleCopy = async () => {
    const success = await copyToClipboard(result);

    if (success) {
      toast({
        title: '복사 완료',
        description: '사주분석 결과가 클립보드에 복사되었습니다.',
      });

      setCopyIcon('check');
      setTimeout(() => {
        setCopyIcon('copy');
      }, 2000);
    } else {
      toast({
        title: '복사 실패',
        description: '복사에 실패했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">사주분석 결과</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="사주분석 결과 복사"
          >
            {copyIcon === 'copy' ? (
              <Copy className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            결과 복사
          </Button>
          <DeleteTestDialog testId={testId} testName={testName} />
        </div>
      </div>

      {modelUsed === 'pro' ? (
        <Alert className="border-primary bg-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription>
            이 분석은 <strong>Pro 구독</strong>으로 생성된 고급 분석입니다.
            직업운, 사업운, 월별 운세가 포함되어 있습니다.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            기본 분석 결과입니다. <strong>Pro 구독</strong> 시 더욱 상세한 분석을 받을 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg p-6">
        <MarkdownRenderer content={result} />
      </div>
    </div>
  );
}
