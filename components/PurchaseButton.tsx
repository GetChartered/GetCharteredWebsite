import React from "react";
import SubscriptionDetails from "@/components/SubscriptionDetails";
import {auth0} from "@/lib/auth0";

export default async function PurchaseButton(){

    const subscriptionData = await SubscriptionDetails();

    if (subscriptionData.status === 3 || subscriptionData.status === 5){
        return(
            <div>
                <form action="/api/checkout_sessions" method="POST">
                    <section>
                        <button
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                            type="submit" role="link">
                            Purchase
                        </button>
                    </section>
                </form>
            </div>
        );
    }
    else if (subscriptionData.status === 1){
        return (
            <a
                href="/auth/login"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            >
                Purchase
            </a>
        );
    }
    else if (subscriptionData.status === 6){
        const session = await auth0.getSession();
        if (session){
            return(
                <p>Logged in as {session.user.name}</p>
            );
        }
    }
}