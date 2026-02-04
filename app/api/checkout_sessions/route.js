import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { stripe } from '@/lib/stripe'
import {auth0} from "../../../lib/auth0";

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

        // Validate origin header
        const headersList = await headers()
        const origin = headersList.get('origin')

        if (!origin) {
            return NextResponse.json(
                { error: 'Invalid request origin' },
                { status: 400 }
            );
        }

        // Validate Stripe price ID is configured
        const priceId = process.env.STRIPE_PRICE_ID;

        if (!priceId) {
            console.error('STRIPE_PRICE_ID environment variable is not configured');
            return NextResponse.json(
                { error: 'Payment configuration error' },
                { status: 500 }
            );
        }

        // Check if user already has an active subscription
        try {
            const existingCustomer = await stripe.customers.search({
                query: `email:'${authSession.user.email}'`,
            });

            if (existingCustomer.data.length > 0) {
                const customerId = existingCustomer.data[0].id;

                // Check for active subscriptions
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'active',
                    limit: 1,
                });

                if (subscriptions.data.length > 0) {
                    // User already has active subscription - redirect to account page
                    return NextResponse.redirect(
                        `${origin}/my-account?error=already_subscribed`,
                        303
                    );
                }
            }
        } catch (subscriptionCheckError) {
            // Log the error but don't block checkout - better to allow duplicate than block legitimate purchase
            console.warn('Failed to check existing subscription:', subscriptionCheckError);
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/?canceled=true`,
            customer_email: authSession.user.email,
        });

        return NextResponse.redirect(session.url, 303)
    } catch (err) {
        console.error('Checkout session creation error:', err);
        return NextResponse.json(
            { error: 'Failed to create checkout session. Please try again.' },
            { status: 500 }
        )
    }
}
