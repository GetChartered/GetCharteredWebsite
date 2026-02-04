"use server";

import SubscriptionDetails from "@/components/SubscriptionDetails";
import { stripe } from "@/lib/stripe";

export default async function CancelSubscription(formData: FormData) {
    // Extract cancel reason from formData
    const reason = formData.get('reason') as string;
    const subscriptionId = formData.get('subscriptionId') as string;

    // TODO: Send cancel reason to AWS/analytics for feedback tracking
    // This could be sent to CloudWatch, S3, or a dedicated analytics service
    if (reason) {
        console.log('Subscription cancellation reason:', {
            subscriptionId,
            reason,
            timestamp: new Date().toISOString(),
        });
    }

    // Get customer subscription details
    const customerData = await SubscriptionDetails();

    // Handle cases where subscription data is not available
    if (!customerData.body) {
        const errorMessages = {
            1: 'No active session found. Please log in.',
            2: 'Customer account not found.',
            3: 'No customer record found.',
            4: 'Failed to retrieve subscription list.',
            5: 'No active subscription found.',
        };

        const errorMessage = errorMessages[customerData.status as keyof typeof errorMessages]
            || 'Unable to retrieve subscription details.';

        throw new Error(errorMessage);
    }

    // Cancel the subscription
    try {
        await stripe.subscriptions.cancel(customerData.body.id);

        return {
            success: true,
            message: 'Your subscription has been cancelled successfully. You will retain access until the end of your current billing period.',
        };
    } catch (error) {
        console.error('Stripe subscription cancellation error:', error);
        throw new Error('Failed to cancel subscription. Please try again or contact support.');
    }
}
