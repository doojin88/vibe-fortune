/**
 * 구독 실패 페이지
 *
 * 토스페이먼츠 카드 등록 실패 또는 사용자 취소 시 리다이렉트되는 페이지입니다.
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';

export default function SubscriptionFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get('code');
  const message = searchParams.get('message');

  const getErrorMessage = () => {
    if (code === 'USER_CANCEL') {
      return '사용자가 카드 등록을 취소했습니다.';
    }
    return message || '카드 등록 중 오류가 발생했습니다.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <XCircle className="h-6 w-6 text-destructive" />
            구독 실패
          </CardTitle>
          <CardDescription className="text-center">
            Pro 구독 신청이 완료되지 않았습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">오류 내용</p>
              <p className="mt-1 text-xs">
                {getErrorMessage()}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-medium text-foreground">다음과 같은 경우에 실패할 수 있습니다:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>카드 정보를 잘못 입력한 경우</li>
              <li>본인인증에 실패한 경우</li>
              <li>카드사에서 거절한 경우</li>
              <li>사용자가 결제창을 닫은 경우</li>
            </ul>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              대시보드
            </Button>
            <Button
              onClick={() => router.push('/subscription')}
              className="flex-1"
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
