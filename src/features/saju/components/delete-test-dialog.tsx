/**
 * 사주분석 삭제 확인 다이얼로그
 *
 * 사용자가 사주분석을 삭제하기 전에 확인을 받는 다이얼로그입니다.
 * 삭제는 되돌릴 수 없으므로 신중한 확인이 필요합니다.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteSajuTest } from '@/features/saju/actions/delete-saju-test';

interface DeleteTestDialogProps {
  testId: string;
  testName: string;
}

export function DeleteTestDialog({ testId, testName }: DeleteTestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteSajuTest(testId);
      
      if (result?.success === false) {
        toast({
          variant: 'destructive',
          title: '삭제 실패',
          description: result.error || '사주분석 삭제에 실패했습니다.',
        });
        setLoading(false);
        return;
      }

      // 성공 시 토스트 메시지 및 리다이렉트
      toast({
        title: '삭제 완료',
        description: '사주분석이 삭제되었습니다.',
      });

      setOpen(false);
      
      // 대시보드로 리다이렉트
      router.push('/dashboard');
    } catch (error: any) {
      console.error('사주분석 삭제 실패:', error);
      
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '사주분석 삭제에 실패했습니다. 다시 시도해주세요.',
      });
      
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label="사주분석 삭제"
        >
          <Trash2 className="h-4 w-4" />
          검사 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>사주분석 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>"{testName}"</strong> 사주분석을 삭제하시겠습니까?
            <br />
            <br />
            이 작업은 되돌릴 수 없으며, 분석 결과가 영구적으로 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? '삭제 중...' : '삭제하기'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
