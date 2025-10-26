'use client';

import { useState } from 'react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { useToast } from '@/hooks/use-toast';

type AnalysisResultSectionProps = {
  result: string;
};

export function AnalysisResultSection({ result }: AnalysisResultSectionProps) {
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
      </div>

      <div className="border rounded-lg p-6">
        <MarkdownRenderer content={result} />
      </div>
    </div>
  );
}
