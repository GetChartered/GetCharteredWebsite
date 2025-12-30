import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { stripe } from '@/lib/stripe'
import {auth0} from "../../../lib/auth0";

export async function POST() {

    try {
        const authSession = await auth0.getSession();
        const headersList = await headers()
        const origin = headersList.get('origin')

        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    // Provide the exact Price ID (for example, price_1234) of the product you want to sell
                    price: 'price_1SgRu6Bw4Vb6w5snb9KkhGLZ',
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            customer_email: `${authSession.user.email}`,
        });
        return NextResponse.redirect(session.url, 303)
    } catch (err) {
        return NextResponse.json(
            { error: err.message },
            { status: err.statusCode || 500 }
        )
    }
}