/**
 * 구독 정보 카드 컴포넌트
 *
 * 현재 사용자의 구독 정보를 표시합니다:
 * - 이메일
 * - 요금제 (무료/Pro)
 * - 잔여 검사 횟수
 * - 다음 결제일 (Pro인 경우)
 * - 카드 정보 (Pro인 경우)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionStatus } from './subscription-status';
import { formatDate } from '@/lib/utils/date';
import type { SubscriptionInfo } from '@/features/subscription/queries/get-subscription';
import { CreditCard, Calendar, Hash, AlertCircle } from 'lucide-react';

interface SubscriptionCardProps {
  email: string;
  subscription: SubscriptionInfo;
}

export function SubscriptionCard({ email, subscription }: SubscriptionCardProps) {
  const { status, testCount, nextBillingDate, cardNumber, cardCompany } = subscription;

  // 구독 상태에 따른 설명 메시지
  const getDescription = () => {
    switch (status) {
      case 'free':
        return '무료 요금제를 사용 중입니다. Pro 구독으로 월 10회 고급 분석을 이용하세요!';
      case 'pro':
        return `Pro 구독이 활성화되어 있습니다. 다음 결제일에 자동으로 9,900원이 결제됩니다.`;
      case 'cancelled':
        return `구독이 취소 예약되었습니다. ${nextBillingDate ? formatDate(nextBillingDate) : '다음 결제일'}까지 Pro 혜택이 유지됩니다.`;
      case 'payment_failed':
        return '결제에 실패했습니다. 카드 한도 초과 또는 잔액 부족일 수 있습니다. 3일 후 자동으로 재시도되며, 실패 시 구독이 자동 해지됩니다.';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>구독 정보</CardTitle>
          <SubscriptionStatus status={status} />
        </div>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 이메일 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">이메일:</span>
          <span className="font-medium">{email}</span>
        </div>

        {/* 요금제 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">현재 요금제:</span>
          <span className="font-medium">
            {status === 'free' ? '무료' : status === 'cancelled' ? 'Pro (취소 예약)' : status === 'payment_failed' ? 'Pro (결제 실패)' : 'Pro'}
          </span>
        </div>

        {/* 잔여 횟수 */}
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">잔여 검사 횟수:</span>
          <span className="font-medium">
            {testCount}회{status !== 'free' && ' / 월 10회'}
          </span>
        </div>

        {/* 다음 결제일 (Pro인 경우) */}
        {nextBillingDate && (status === 'pro' || status === 'cancelled' || status === 'payment_failed') && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {status === 'cancelled' ? '해지 예정일:' : '다음 결제일:'}
            </span>
            <span className="font-medium">{formatDate(nextBillingDate)}</span>
          </div>
        )}

        {/* 카드 정보 (Pro인 경우) */}
        {cardNumber && cardCompany && (status === 'pro' || status === 'cancelled' || status === 'payment_failed') && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">카드 정보:</span>
            <span className="font-medium">
              {cardCompany} **** **** **** {cardNumber}
            </span>
          </div>
        )}

        {/* 경고 메시지 (결제 실패) */}
        {status === 'payment_failed' && (
          <div className="flex gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">결제 실패</p>
              <p className="mt-1 text-xs">
                카드 한도를 확인하고 결제 재시도를 눌러주세요.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
