import { auth0 } from '@/lib/auth0';
import SubscriptionDetails from '@/components/SubscriptionDetails';
import Link from 'next/link';
import { SubscriptionCard } from '@/components/account/SubscriptionCard';
import { CancelSubscriptionDialog } from '@/components/account/CancelSubscriptionDialog';

export default async function SubscriptionsPage() {
  const session = await auth0.getSession();
  const subscriptionData = await SubscriptionDetails();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-title font-bold text-text-main mb-2">Subscriptions</h2>
        <p className="text-body text-text-secondary">
          Manage your subscription plans and billing information
        </p>
      </div>

      {/* Current Subscription */}
      {subscriptionData.status === 6 && subscriptionData.body ? (
        <CurrentSubscription subscriptionData={subscriptionData.body} />
      ) : (
        <NoSubscription status={subscriptionData.status} />
      )}

      {/* Billing History */}
      <div className="card p-8">
        <h3 className="text-label font-semibold text-text-main mb-6">Billing History</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-background-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📄</span>
          </div>
          <p className="text-body text-text-secondary mb-4">
            View your billing history and invoices
          </p>
          <a
            href="https://billing.stripe.com/p/login/test_eVq28qaky3hjfeK5223oA00"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            View in Stripe Portal
          </a>
        </div>
      </div>
    </div>
  );
}

function CurrentSubscription({ subscriptionData }: { subscriptionData: any }) {
  const status = subscriptionData.status;
  const currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);

  return (
    <div className="card p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-label font-semibold text-text-main mb-1">Current Plan</h3>
          <p className="text-caption text-text-secondary">Your active subscription</p>
        </div>
        <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-info'} capitalize`}>
          {status}
        </span>
      </div>

      <div className="space-y-6">
        {/* Plan Details */}
        <div className="p-6 rounded-lg bg-background-muted">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-display font-bold text-text-main">£14.99</span>
            <span className="text-body text-text-secondary">/month</span>
          </div>
          <h4 className="text-title font-semibold text-text-main mb-4">Premium Plan</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-body text-text-secondary">
              <span className="text-color-success">✓</span>
              Unlimited practice questions
            </li>
            <li className="flex items-center gap-2 text-body text-text-secondary">
              <span className="text-color-success">✓</span>
              All modules included
            </li>
            <li className="flex items-center gap-2 text-body text-text-secondary">
              <span className="text-color-success">✓</span>
              Advanced analytics
            </li>
            <li className="flex items-center gap-2 text-body text-text-secondary">
              <span className="text-color-success">✓</span>
              Mock exams & timed practice
            </li>
          </ul>
        </div>

        {/* Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border-subtle">
            <p className="text-caption text-text-secondary mb-1">Next Billing Date</p>
            <p className="text-label font-semibold text-text-main">
              {currentPeriodEnd.toLocaleDateString()}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border-subtle">
            <p className="text-caption text-text-secondary mb-1">Next Payment</p>
            <p className="text-label font-semibold text-text-main">£14.99</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border-subtle">
          <a
            href="https://billing.stripe.com/p/login/test_eVq28qaky3hjfeK5223oA00"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Manage in Stripe
          </a>
          <CancelSubscriptionDialog subscriptionId={subscriptionData.id} />
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
    <div className="card p-8">
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-background-muted flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">💳</span>
        </div>
        <h3 className="text-title font-semibold text-text-main mb-2">{message}</h3>
        <p className="text-body text-text-secondary mb-6">{description}</p>
        {(status === 3 || status === 5) && (
          <form action="/api/checkout_sessions" method="POST">
            <button type="submit" className="btn btn-primary">
              Subscribe Now
            </button>
          </form>
        )}
        {status === 1 && (
          <Link href="/auth/login" className="btn btn-primary">
            Log In
          </Link>
        )}
      </div>
    </div>
  );
}
