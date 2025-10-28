/**
 * Pro 구독 신청 다이얼로그
 *
 * 토스페이먼츠 SDK를 사용하여 카드 등록 및 빌링키 발급을 진행합니다.
 * - 카드 정보 입력 (토스페이먼츠 UI)
 * - 본인인증
 * - authKey 수신
 * - 서버에서 빌링키 발급 및 첫 결제
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { requestBillingAuth } from '@/lib/toss-payments';
import { v4 as uuidv4 } from 'uuid';

interface SubscribeProDialogProps {
  customerEmail: string;
  customerName: string;
}

export function SubscribeProDialog({ customerEmail, customerName }: SubscribeProDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerKey, setCustomerKey] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // customerKey 생성 (다이얼로그 열 때마다 새로 생성)
  useEffect(() => {
    if (open) {
      setCustomerKey(uuidv4());
    }
  }, [open]);

  const handleSubscribe = async () => {
    if (!customerKey) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: 'customerKey가 생성되지 않았습니다. 다시 시도해주세요.',
      });
      return;
    }

    setLoading(true);

    try {
      // customerKey를 세션에 임시 저장 (성공 페이지에서 사용)
      sessionStorage.setItem('customerKey', customerKey);

      // 토스페이먼츠 카드 등록 요청
      await requestBillingAuth(customerKey, {
        method: 'CARD',
        successUrl: `${window.location.origin}/subscription/success`,
        failUrl: `${window.location.origin}/subscription/fail`,
        customerEmail,
        customerName,
      });

      // 토스페이먼츠 창이 열리면 로딩 종료
      // 실제 처리는 success 페이지에서 진행
      setLoading(false);
      setOpen(false);
    } catch (error: any) {
      console.error('카드 등록 실패:', error);

      let errorMessage = '카드 등록에 실패했습니다. 다시 시도해주세요.';

      if (error.code === 'USER_CANCEL') {
        errorMessage = '사용자가 결제창을 닫았습니다.';
      } else if (error.code === 'INVALID_CUSTOMER_KEY') {
        errorMessage = 'customerKey 형식 오류입니다.';
      }

      toast({
        variant: 'destructive',
        title: '카드 등록 실패',
        description: errorMessage,
      });

      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          Pro 구독하기
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pro 구독 신청</DialogTitle>
          <DialogDescription>
            월 9,900원으로 매월 10회의 고급 사주 분석을 이용하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2 text-sm">
            <h4 className="font-medium">Pro 혜택</h4>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>월 10회 고급 사주 분석</li>
              <li>Gemini Pro 모델 사용</li>
              <li>더 정확하고 상세한 분석</li>
              <li>직업운 및 월별 운세 포함</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2 text-sm">
            <h4 className="font-medium">결제 정보</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>월 요금: 9,900원</li>
              <li>첫 결제: 즉시 (카드 등록 후)</li>
              <li>다음 결제: 매월 자동 결제</li>
              <li>언제든지 취소 가능</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
            카드 등록 후 즉시 첫 결제가 진행됩니다.
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSubscribe}
            disabled={loading || !customerKey}
          >
            {loading ? '처리 중...' : '카드 등록하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
