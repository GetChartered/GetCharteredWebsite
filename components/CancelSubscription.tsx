"use server";

import SubscriptionDetails from "@/components/SubscriptionDetails";

export default async function CancelSubscription(formData: FormData){

    //Send cancel reason to aws containing formData

    const customerData = await SubscriptionDetails();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const subscription = await stripe.subscriptions.cancel(
        customerData.body.id
    );

    // return to home page
}