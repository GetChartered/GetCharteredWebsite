import {auth0} from "@/lib/auth0";

export default async function SubscriptionDetails(){
    const session = await auth0.getSession();

    if(!session){
        return {
            status: 1,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    const subscription = await stripe.subscriptions.list();

    if (!subscription) {
        return {
            status: 4,
        };
    }

    let hasSubscription = false;
    let customerData;
    for (let i = 0; i < subscription.data.length; i++){
        if (subscription.data[i].customer == customerId){
            customerData = subscription.data[i];
            hasSubscription = true;
        }
    }

    if (!hasSubscription) {
        return {
            status: 5,
        };
    }

    return {
        status: 6,
        body: customerData,
    };
}