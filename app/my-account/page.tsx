import { auth0 } from '@/lib/auth0';
import Link from 'next/link';
import { CreditCard, User, ArrowRight } from 'lucide-react';
import SubscriptionDetails from '@/components/SubscriptionDetails';

export default async function MyAccountPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  const subscriptionData = await SubscriptionDetails();

  let subscriptionStatus = 'No active subscription';
  let nextPaymentDate = null;

  if (subscriptionData.status === 6 && subscriptionData.body) {
    subscriptionStatus = subscriptionData.body.status;

    if (subscriptionData.body.current_period_end) {
      nextPaymentDate = new Date(subscriptionData.body.current_period_end * 1000);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Subscription Card */}
      <Link
        href="/my-account/subscriptions"
        className="card card-hover block no-underline"
        style={{ padding: '24px', color: 'inherit', textDecoration: 'none' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 173, 181, 0.12)' }}
          >
            <CreditCard size={22} style={{ color: 'var(--accent-blue)' }} />
          </div>
          {subscriptionData.status === 6 && (
            <span className="badge badge-success capitalize">
              {subscriptionStatus}
            </span>
          )}
        </div>
        <h3 className="text-label mb-1" style={{ fontWeight: 700, color: 'var(--color-text)' }}>Subscription</h3>
        <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
          {subscriptionData.status === 6 ? 'Premium Plan' : 'No active subscription'}
        </p>
        {nextPaymentDate && (
          <p className="text-text-muted mt-1" style={{ fontSize: '13px' }}>
            Renews {nextPaymentDate.toLocaleDateString()}
          </p>
        )}
        <div
          className="flex items-center gap-2 mt-4 text-body font-medium"
          style={{ color: 'var(--color-tint)' }}
        >
          Manage subscription <ArrowRight size={16} />
        </div>
      </Link>

      {/* Profile Card */}
      <Link
        href="/my-account/profile"
        className="card card-hover block no-underline"
        style={{ padding: '24px', color: 'inherit', textDecoration: 'none' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(192, 132, 252, 0.12)' }}
          >
            <User size={22} style={{ color: 'var(--accent-purple)' }} />
          </div>
        </div>
        <h3 className="text-label mb-1" style={{ fontWeight: 700, color: 'var(--color-text)' }}>Profile</h3>
        <p
          className="text-caption"
          style={{
            color: 'var(--color-text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user?.email}
        </p>
        <div
          className="flex items-center gap-2 mt-4 text-body font-medium"
          style={{ color: 'var(--color-tint)' }}
        >
          Edit profile <ArrowRight size={16} />
        </div>
      </Link>
    </div>
  );
}
