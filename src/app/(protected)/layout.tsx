import { type ReactNode } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { getSubscription } from "@/features/subscription/queries/get-subscription";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // 구독 정보 조회
  const subscription = await getSubscription();

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        {/* 데스크톱 사이드바 */}
        {subscription && (
          <DashboardSidebar
            userEmail={subscription.userEmail}
            subscriptionStatus={subscription.status}
            testCount={subscription.testCount}
            nextBillingDate={subscription.nextBillingDate}
          />
        )}

        {/* 메인 컨텐츠 */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* 모바일 사이드바 */}
      {subscription && (
        <MobileSidebar
          userEmail={subscription.userEmail}
          subscriptionStatus={subscription.status}
          testCount={subscription.testCount}
          nextBillingDate={subscription.nextBillingDate}
        />
      )}
    </div>
  );
}
