/**
 * 구독 상태 배지 컴포넌트
 *
 * 사용자의 구독 상태를 시각적으로 표시합니다.
 */

import { Badge } from '@/components/ui/badge';

interface SubscriptionStatusProps {
  status: 'free' | 'pro' | 'cancelled' | 'payment_failed';
}

export function SubscriptionStatus({ status }: SubscriptionStatusProps) {
  const statusConfig = {
    free: {
      label: '무료',
      variant: 'secondary' as const,
    },
    pro: {
      label: 'Pro',
      variant: 'default' as const,
    },
    cancelled: {
      label: '취소 예약',
      variant: 'outline' as const,
    },
    payment_failed: {
      label: '결제 실패',
      variant: 'destructive' as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
