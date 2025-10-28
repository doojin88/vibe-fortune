'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';
import { Home, PlusCircle, CreditCard } from 'lucide-react';

type DashboardSidebarProps = {
  userEmail: string;
  subscriptionStatus: 'free' | 'pro' | 'cancelled' | 'payment_failed';
  testCount: number;
  nextBillingDate: string | null;
};

const navItems = [
  { label: '대시보드', href: '/dashboard', icon: Home },
  { label: '새 검사', href: '/dashboard/new', icon: PlusCircle },
  { label: '구독 관리', href: '/subscription', icon: CreditCard },
];

const subscriptionLabels = {
  free: '무료 요금제',
  pro: 'Pro 요금제',
  cancelled: 'Pro (취소 예약)',
  payment_failed: '결제 실패',
};

const subscriptionVariants = {
  free: 'secondary',
  pro: 'default',
  cancelled: 'outline',
  payment_failed: 'destructive',
} as const;

export function DashboardSidebar({
  userEmail,
  subscriptionStatus,
  testCount,
  nextBillingDate,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/10 p-6 hidden lg:block">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground truncate" title={userEmail}>
          {userEmail}
        </p>
      </div>

      <Separator className="mb-6" />

      <div className="mb-6 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">요금제</p>
          <Badge variant={subscriptionVariants[subscriptionStatus]}>
            {subscriptionLabels[subscriptionStatus]}
          </Badge>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">잔여 검사 횟수</p>
          <p className="text-2xl font-bold">{testCount}회</p>
        </div>

        {nextBillingDate && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {subscriptionStatus === 'cancelled' ? '해지 예정일' : '다음 결제일'}
            </p>
            <p className="text-sm">{formatDate(nextBillingDate, 'yyyy-MM-dd')}</p>
          </div>
        )}

        {subscriptionStatus === 'payment_failed' && (
          <p className="text-xs text-destructive">
            결제 실패. 구독 관리 페이지에서 확인하세요.
          </p>
        )}
      </div>

      <Separator className="mb-6" />

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
