/**
 * 구독 재개 확인 다이얼로그
 *
 * 취소 예약된 구독을 재개할 때 확인 메시지를 표시합니다.
 * - 다음 결제일 자동 결제 안내
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
import { useToast } from '@/hooks/use-toast';
import { resumeSubscription } from '@/features/subscription/actions/resume-subscription';
import { formatDate } from '@/lib/utils/date';

interface ResumeSubscriptionDialogProps {
  nextBillingDate: string | null;
}

export function ResumeSubscriptionDialog({ nextBillingDate }: ResumeSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleResume = async () => {
    setLoading(true);

    try {
      const result = await resumeSubscription();

      if (result.success) {
        toast({
          title: '구독이 재개되었습니다',
          description: `${nextBillingDate ? formatDate(nextBillingDate) : '다음 결제일'}에 자동 결제가 진행됩니다.`,
        });

        setOpen(false);
        router.refresh(); // 페이지 리로드로 최신 상태 반영
      } else {
        toast({
          variant: 'destructive',
          title: '구독 재개 실패',
          description: result.error || '일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        });
      }
    } catch (error: any) {
      console.error('구독 재개 실패:', error);
      toast({
        variant: 'destructive',
        title: '구독 재개 실패',
        description: '일시적인 오류가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button>구독 재개</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>구독을 재개하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              다음 결제일({nextBillingDate ? formatDate(nextBillingDate) : '예정일'})에 자동 결제가 진행됩니다.
            </p>
            <p className="text-sm">
              월 9,900원이 자동으로 결제됩니다.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleResume} disabled={loading}>
            {loading ? '처리 중...' : '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
