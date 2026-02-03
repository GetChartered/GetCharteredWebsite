import {auth0} from "@/lib/auth0";
import { stripe } from "@/lib/stripe";

export default async function SubscriptionDetails(){
    const session = await auth0.getSession();

    if(!session){
        return {
            status: 1,
        };
    }

    const customer = await stripe.customers.search({
        query: `email:\'${session.user.email}\'`,
    });

    if (!customer) {
        return {
            status: 2,
        };
    }

    if (customer.data.length == 0){
        return {
            status: 3,
        };
    }

    const customerId = customer.data[0].id;

    // Filter subscriptions by customer ID instead of fetching all
    const subscriptionList = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
    });

    if (!subscriptionList) {
        return {
            status: 4,
        };
    }

    // Check if customer has any active subscriptions
    if (subscriptionList.data.length === 0) {
        return {
            status: 5,
        };
    }

    // Get the subscription ID and retrieve it directly to get all fields
    // Expand latest_invoice to get period_start and period_end for flexible billing subscriptions
    const subscriptionId = subscriptionList.data[0].id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice']
    });

    return {
        status: 6,
        body: subscription,
    };
}
