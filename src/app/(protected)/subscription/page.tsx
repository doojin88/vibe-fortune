import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSubscription } from '@/features/subscription/queries/get-subscription';
import { SubscriptionCard } from '@/features/subscription/components/subscription-card';
import { SubscribeProDialog } from '@/features/subscription/components/subscribe-pro-dialog';
import { CancelSubscriptionDialog } from '@/features/subscription/components/cancel-subscription-dialog';
import { ResumeSubscriptionDialog } from '@/features/subscription/components/resume-subscription-dialog';
import { currentUser } from '@clerk/nextjs/server';

export default async function SubscriptionPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }

  const user = await currentUser();
  const subscription = await getSubscription();

  if (!subscription) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Subscription</h1>
          <p className="text-muted-foreground">
            Failed to load subscription information.
          </p>
        </div>
      </div>
    );
  }

  const { status, nextBillingDate } = subscription;
  const customerEmail = user?.primaryEmailAddress?.emailAddress || '';
  const customerName = user?.fullName || user?.firstName || '';

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          View and manage your subscription status.
        </p>
      </div>

      <SubscriptionCard email={customerEmail} subscription={subscription} />

      <div className="flex justify-center">
        {status === 'free' && (
          <SubscribeProDialog
            customerEmail={customerEmail}
            customerName={customerName}
          />
        )}

        {status === 'pro' && (
          <CancelSubscriptionDialog nextBillingDate={nextBillingDate} />
        )}

        {status === 'cancelled' && (
          <ResumeSubscriptionDialog nextBillingDate={nextBillingDate} />
        )}

        {status === 'payment_failed' && (
          <div className="space-y-4 w-full max-w-md">
            <p className="text-center text-sm text-muted-foreground">
              Payment failed. Please register your card information again.
            </p>
            <SubscribeProDialog
              customerEmail={customerEmail}
              customerName={customerName}
            />
          </div>
        )}
      </div>
    </div>
  );
}
