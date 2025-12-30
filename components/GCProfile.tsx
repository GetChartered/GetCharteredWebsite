"use server";

import React from "react";
import SubscriptionDetails from "@/components/SubscriptionDetails";
import Link from "next/link";
import PurchaseButton from "@/components/PurchaseButton";

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
        }
    }



    let subType = '';
    if (customerData.body.items.data[0].plan.amount === 1000){
        subType = 'Standard';
    } else {
        subType = 'Premium';
    }

    return (
        <div>
            <p>Course: {customerData.body.course}</p>
            <p>Subscription Type: {subType}</p>
            <p>Subscription Status: {customerData.body.status}</p>
            <p>Next Payment: {customerData.body.days_until_due}</p>
            <br></br>
            <Link
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="https://billing.stripe.com/p/login/test_eVq28qaky3hjfeK5223oA00"
                rel="noopener noreferrer"
            >
                Manage Your Subscription
            </Link>
            <br></br>
        </div>
    );
}