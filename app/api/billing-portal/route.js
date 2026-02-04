import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth0 } from '@/lib/auth0'
import SubscriptionDetails from '@/components/SubscriptionDetails'

/**
 * Create a Stripe Billing Portal Session
 *
 * This endpoint creates a secure billing portal session that allows
 * customers to manage their subscriptions, update payment methods,
 * and view billing history.
 */
export async function POST() {
  try {
    // Validate authentication
    const authSession = await auth0.getSession();

    if (!authSession?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get customer subscription details
    const customerData = await SubscriptionDetails();

    if (customerData.status !== 6 || !customerData.body) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get the customer ID from the subscription
    const customerId = customerData.body.customer;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID not found' },
        { status: 400 }
      );
    }

    // Get the origin for return URL
    const headersList = await headers();
    const origin = headersList.get('origin');

    if (!origin) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/my-account/subscriptions`,
    });

    // Return the portal URL
    return NextResponse.json({ url: portalSession.url });

  } catch (err) {
    console.error('Billing portal creation error:', err);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
