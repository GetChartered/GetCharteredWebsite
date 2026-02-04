import Link from 'next/link';
import { CreditCard, Calendar } from 'lucide-react';
import SubscriptionDetails from '@/components/SubscriptionDetails';
import { CancelSubscriptionDialog } from '@/components/account/CancelSubscriptionDialog';
import { BillingPortalButton } from '@/components/BillingPortalButton';

export default async function MyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const subscriptionData = await SubscriptionDetails();
  const params = await searchParams;
  const error = params.error as string | undefined;
  const cancelled = params.cancelled as string | undefined;

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error === 'already_subscribed' && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '14px',
            lineHeight: '20px',
          }}
        >
          You already have an active subscription. You cannot purchase another subscription while one is active.
        </div>
      )}

      {cancelled === 'true' && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
            fontSize: '14px',
            lineHeight: '20px',
          }}
        >
          Your subscription has been cancelled successfully. You will retain access until the end of your current billing period.
        </div>
      )}

      {/* Subscription Section */}
      <div>
        <h2 className="text-title mb-2" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
          Subscription
        </h2>
        <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your subscription plan and billing information
        </p>

        {subscriptionData.status === 6 && subscriptionData.body ? (
          <CurrentSubscription subscriptionData={subscriptionData.body} />
        ) : (
          <NoSubscription status={subscriptionData.status} />
        )}
      </div>

      {/* Account Security Section */}
      <div>
        <h2 className="text-title mb-2" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
          Account Security
        </h2>
        <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your password and security settings
        </p>

        <div className="card" style={{ padding: "24px" }}>
          <div className="space-y-8">
            <div className="p-4 rounded-lg">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-label mb-1" style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                    Password
                  </p>
                  <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                    Manage your password through your authentication provider
                  </p>
                </div>
                <a
                  href="/auth/login?screen_hint=reset-password"
                  className="btn btn-outline btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  Change Password
                </a>
              </div>
            </div>

            <div className="p-4 rounded-lg">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-label mb-1" style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                    Two-Factor Authentication
                  </p>
                  <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                    Add an extra layer of security to your account
                  </p>
                </div>
                <span className="badge" style={{ flexShrink: 0 }}>
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h2 className="text-title mb-2" style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
          Danger Zone
        </h2>
        <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Irreversible actions for your account
        </p>

        <div
          className="card border-2 border-color-danger/20"
          style={{ padding: "24px" }}
        >
          <div className="p-4 rounded-lg bg-color-danger/5">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-label mb-1" style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                  Delete Account
                </p>
                <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Link
                href="/account/delete"
                className="btn btn-danger btn-sm"
                style={{ flexShrink: 0 }}
              >
                Delete Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) {
    return 'N/A';
  }
  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString();
}

function CurrentSubscription({ subscriptionData }: { subscriptionData: any }) {
  const status = subscriptionData.status;

  // Extract price information from subscription
  const priceData = subscriptionData.items?.data?.[0]?.price;
  const amountInCents = priceData?.unit_amount || 1499;
  const amountValue = amountInCents / 100;

  // Remove decimals if it's a whole number
  const amount = amountValue % 1 === 0 ? amountValue.toString() : amountValue.toFixed(2);

  const currency = priceData?.currency?.toUpperCase() || 'GBP';
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
  const interval = priceData?.recurring?.interval || 'month';

  const formattedPrice = `${currencySymbol}${amount}`;
  const formattedInterval = `/${interval}`;

  // Get the next billing date
  let nextBillingDate = subscriptionData.current_period_end ||
    subscriptionData.latest_invoice?.period_end || null;

  // If the period_end is in the past, calculate the next billing date
  if (nextBillingDate) {
    const periodEndDate = new Date(nextBillingDate * 1000);
    const now = new Date();

    // If the period end is in the past, calculate next billing date
    if (periodEndDate < now) {
      const billingDay = periodEndDate.getDate();
      const nextDate = new Date(now);
      const intervalCount = priceData?.recurring?.interval_count || 1;

      // Set to the same day in the current period
      nextDate.setDate(billingDay);

      // If that date has already passed this period, move to next billing period
      if (nextDate <= now) {
        // Add the appropriate time based on billing interval
        switch (interval) {
          case 'day':
            nextDate.setDate(nextDate.getDate() + intervalCount);
            break;
          case 'week':
            nextDate.setDate(nextDate.getDate() + (7 * intervalCount));
            break;
          case 'month':
            nextDate.setMonth(nextDate.getMonth() + intervalCount);
            break;
          case 'year':
            nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
            break;
          default:
            // Default to monthly if interval is unknown
            nextDate.setMonth(nextDate.getMonth() + intervalCount);
        }
      }

      // Handle edge case where the day doesn't exist in the target month (e.g., 31st in a 30-day month)
      if ((interval === 'month' || interval === 'year') && nextDate.getDate() !== billingDay) {
        nextDate.setDate(0); // Set to last day of previous month
      }

      nextBillingDate = Math.floor(nextDate.getTime() / 1000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <div className="card" style={{ padding: '24px' }}>
        {/* Plan header */}
        <div className="flex items-start justify-between" style={{ marginBottom: '24px' }}>
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 173, 181, 0.12)' }}
            >
              <CreditCard size={22} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>
                Premium Plan
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-title" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                  {formattedPrice}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {formattedInterval}
                </span>
              </div>
            </div>
          </div>
          <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-info'} capitalize`}>
            {status}
          </span>
        </div>

        {/* Billing details */}
        <div style={{ marginBottom: '24px' }}>
          <div className="flex items-center gap-3" style={{ fontSize: '14px' }}>
            <Calendar size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <span style={{ color: 'var(--color-text-secondary)', paddingLeft: '8px' }}>
              Next bill:{' '}
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                {formattedPrice}
              </span>
              {' '}on{' '}
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                {formatDate(nextBillingDate)}
              </span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-wrap gap-4"
          style={{ paddingTop: '20px', borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <BillingPortalButton />
          <CancelSubscriptionDialog subscriptionId={subscriptionData.id} />
        </div>
      </div>

      {/* What's Included */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 className="mb-4" style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '14px' }}>
          What's included
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Unlimited practice questions', 'All modules included', 'Advanced analytics', 'Mock exams & timed practice'].map((feature) => (
            <div key={feature} className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              <span style={{ color: 'var(--color-success)' }}>✓</span>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoSubscription({ status }: { status: number }) {
  let message = 'You don\'t have an active subscription';
  let description = 'Subscribe to get access to all features';

  if (status === 1) {
    message = 'Please log in to view subscriptions';
    description = 'You need to be logged in to manage your subscription';
  } else if (status === 2 || status === 4) {
    message = 'Unable to load subscription data';
    description = 'Please try refreshing the page';
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className="text-center py-10">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(0, 173, 181, 0.12)' }}
        >
          <CreditCard size={24} style={{ color: 'var(--accent-blue)' }} />
        </div>
        <h3 className="text-title mb-2" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
          {message}
        </h3>
        <p className="text-body mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
        {(status === 3 || status === 5) && (
          <form action="/api/checkout_sessions" method="POST">
            <button type="submit" className="btn btn-primary btn-sm">
              Subscribe Now
            </button>
          </form>
        )}
        {status === 1 && (
          <Link href="/auth/login" className="btn btn-primary btn-sm">
            Log In
          </Link>
        )}
      </div>
    </div>
  );
}
