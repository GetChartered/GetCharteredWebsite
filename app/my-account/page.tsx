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
        className="card card-hover"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 173, 181, 0.12)' }}
          >
            <CreditCard size={24} style={{ color: 'var(--accent-blue)' }} />
          </div>
          {subscriptionData.status === 6 && (
            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
              {subscriptionStatus}
            </span>
          )}
        </div>
        <h3 className="text-kpi-title mb-2">Subscription</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {subscriptionData.status === 6 ? 'Premium Plan' : 'No active subscription'}
        </p>
        {nextPaymentDate && (
          <p
            style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '13px' }}
          >
            Renews {nextPaymentDate.toLocaleDateString()}
          </p>
        )}
        <div
          className="flex items-center gap-2 mt-4"
          style={{ color: 'var(--color-tint)', fontSize: '14px', fontWeight: 500 }}
        >
          Manage subscription <ArrowRight size={16} />
        </div>
      </Link>

      {/* Profile Card */}
      <Link
        href="/my-account/profile"
        className="card card-hover"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(192, 132, 252, 0.12)' }}
          >
            <User size={24} style={{ color: 'var(--accent-purple)' }} />
          </div>
        </div>
        <h3 className="text-kpi-title mb-2">Profile</h3>
        <p
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
          className="flex items-center gap-2 mt-4"
          style={{ color: 'var(--color-tint)', fontSize: '14px', fontWeight: 500 }}
        >
          Edit profile <ArrowRight size={16} />
        </div>
      </Link>
    </div>
  );
}
