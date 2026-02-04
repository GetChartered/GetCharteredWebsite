import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * Stripe Webhook Handler
 *
 * This endpoint receives webhook events from Stripe to handle:
 * - Subscription updates
 * - Payment successes/failures
 * - Customer updates
 *
 * IMPORTANT: This route must be configured in your Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks
 *
 * Events to listen for:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

export async function POST(request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  // Verify webhook signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout session completed:', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
        })

        // TODO: Update your database with subscription information
        // Example: await updateUserSubscription(session.customer, session.subscription)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('Subscription created:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        })

        // TODO: Grant access to your application
        // Example: await grantUserAccess(subscription.customer, subscription.id)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        })

        // TODO: Update user access based on subscription status
        // Example: await updateUserAccess(subscription.customer, subscription.status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        })

        // TODO: Revoke user access
        // Example: await revokeUserAccess(subscription.customer)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Invoice payment succeeded:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
        })

        // TODO: Send receipt email or update billing records
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Invoice payment failed:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
        })

        // TODO: Notify customer of payment failure
        // Example: await sendPaymentFailureEmail(invoice.customer_email)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Error processing webhook event:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
