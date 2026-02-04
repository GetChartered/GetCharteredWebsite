"use server";

import SubscriptionDetails from "@/components/SubscriptionDetails";
import PurchaseButton from "@/components/PurchaseButton";
import { BillingPortalButton } from "@/components/BillingPortalButton";

export default async function GCProfile() {

    const customerData = await SubscriptionDetails();

    if (!customerData){
        return(
            <div>
                <p>ERROR: Customer Information Retrieval Failed. Please reload page. </p>
            </div>
        );
    }

    if (!customerData.body){
        switch (customerData.status){
            case 1:
                return (
                    <div>
                        <p>ERROR: Auth0 session failure. Please reload page. </p>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <p>ERROR: Customer Detail Retrieval Failed. Please reload page. </p>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <p>Subscription Type: Not purchased</p>
                        <PurchaseButton />
                    </div>
                );
            case 4:
                return (
                    <div>
                        <p>ERROR: Subscription Detail Retrieval Failed. Please reload page. </p>
                    </div>
                );
            case 5:
                return (
                    <div>
                        <p>Course: </p>
                        <p>Subscription Type: No Subscription Found</p>
                        <PurchaseButton />
                    </div>
                );
            default:
                return (
                    <div>
                        <p>ERROR: Unknown error occurred. Please reload page.</p>
                    </div>
                );
        }
    }

    // Type assertion for Stripe subscription with all properties
    const subscription = customerData.body as any;

    // Calculate next payment date from current_period_end
    const nextPaymentDate = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
        : 'N/A';

    return (
        <div>
            <p>Subscription Type: Premium</p>
            <p>Subscription Status: {subscription.status}</p>
            <p>Next Payment Date: {nextPaymentDate}</p>
            <br></br>
            <BillingPortalButton className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]">
                Manage Your Subscription
            </BillingPortalButton>
            <br></br>
        </div>
    );
}