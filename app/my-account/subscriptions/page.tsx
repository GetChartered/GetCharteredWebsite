import { auth0 } from '@/lib/auth0';
import SubscriptionDetails from '@/components/SubscriptionDetails';
import Link from 'next/link';
import { CancelSubscriptionDialog } from '@/components/account/CancelSubscriptionDialog';
import { CreditCard, Calendar, Receipt, ExternalLink } from 'lucide-react';

export default async function SubscriptionsPage() {
  const session = await auth0.getSession();
  const subscriptionData = await SubscriptionDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-title mb-2" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
          Subscriptions
        </h2>
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your subscription plans and billing information
        </p>
      </div>

      {/* Current Subscription */}
      {subscriptionData.status === 6 && subscriptionData.body ? (
        <CurrentSubscription subscriptionData={subscriptionData.body} />
      ) : (
        <NoSubscription status={subscriptionData.status} />
      )}
    </div>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

function CurrentSubscription({ subscriptionData }: { subscriptionData: any }) {
  const status = subscriptionData.status;

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
                  £14.99
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  /month
                </span>
              </div>
            </div>
          </div>
          <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-info'} capitalize`}>
            {status}
          </span>
        </div>

        {/* Billing details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div className="flex items-center gap-3" style={{ fontSize: '14px' }}>
            <Calendar size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Next billing date:{' '}
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                {formatDate(subscriptionData.current_period_end)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3" style={{ fontSize: '14px' }}>
            <Receipt size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Next payment:{' '}
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                £14.99
              </span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-wrap gap-4"
          style={{ paddingTop: '20px', borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <a
            href="https://billing.stripe.com/p/login/test_eVq28qaky3hjfeK5223oA00"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <span className="flex items-center gap-2">
              Manage Billing <ExternalLink size={14} />
            </span>
          </a>
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
