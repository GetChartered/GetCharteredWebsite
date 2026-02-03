"use server";

import SubscriptionDetails from "@/components/SubscriptionDetails";
import { stripe } from "@/lib/stripe";

export default async function CancelSubscription(formData: FormData){

    //Send cancel reason to aws containing formData

    const customerData = await SubscriptionDetails();

    const subscription = await stripe.subscriptions.cancel(
        customerData.body.id
    );

    // return to home page
}
