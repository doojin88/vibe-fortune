/**
 * 구독 성공 페이지
 *
 * 토스페이먼츠 카드 등록 성공 후 리다이렉트되는 페이지입니다.
 * authKey를 받아 서버에 빌링키 발급 및 첫 결제를 요청합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmSubscription = async () => {
      const authKey = searchParams.get('authKey');
      const customerKey = searchParams.get('customerKey') || sessionStorage.getItem('customerKey');

      if (!authKey || !customerKey) {
        setError('필수 파라미터가 누락되었습니다.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authKey,
            customerKey,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSuccess(true);
          // customerKey 세션 삭제
          sessionStorage.removeItem('customerKey');

          // 3초 후 구독 관리 페이지로 이동
          setTimeout(() => {
            router.push('/subscription');
          }, 3000);
        } else {
          setError(data.error || '구독 처리에 실패했습니다.');
        }
      } catch (err: any) {
        console.error('구독 확인 실패:', err);
        setError('구독 처리에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    confirmSubscription();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {loading && '구독 처리 중...'}
            {!loading && success && '구독 완료!'}
            {!loading && error && '구독 실패'}
          </CardTitle>
          <CardDescription className="text-center">
            {loading && '잠시만 기다려주세요.'}
            {!loading && success && '성공적으로 Pro 구독이 등록되었습니다.'}
            {!loading && error && '구독 처리 중 오류가 발생했습니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {loading && (
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          )}
          {!loading && success && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                3초 후 구독 관리 페이지로 이동합니다.
              </p>
              <Button onClick={() => router.push('/subscription')} className="w-full">
                바로 이동하기
              </Button>
            </>
          )}
          {!loading && error && (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center text-sm text-muted-foreground">
                {error}
              </p>
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => router.push('/subscription')} className="flex-1">
                  구독 관리
                </Button>
                <Button onClick={() => router.push('/dashboard')} className="flex-1">
                  대시보드
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
