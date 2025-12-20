import { auth0 } from "@/lib/auth0";
import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import React from 'react'
import Link from "next/link";

export default async function Home() {
    const session = await auth0.getSession();
    const user = session?.user;

    const credentials = await session?.tokenSet.accessToken;

    const AWS_API_BASE = "https://mqtt2y9shf.execute-api.eu-west-2.amazonaws.com";

    const url = `${AWS_API_BASE}/GetUserDetails`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials}`,
        },
    });

    const userData = await response.json();

    //check StripeAPI for subscription

    //const STRIPE_API_BASE = "";


    return (
        <div className="light">
            <div className="main-card-wrapper">
                <h1>Get Chartered</h1>
                <div className="action-card">
                    {user ? (
                        <div className="logged-in-section">
                            <h2>Email: {userData.email}</h2>
                            <h2>Course: {userData.course}</h2>
                            <h2>Subscription Type: THIS IS A PLACEHOLDER</h2>
                            <h2>Expiration Date</h2>
                            <Link
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                                href="/purchase"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Purchase
                            </Link>
                            <LogoutButton />
                        </div>
                    ) : (
                        <>
                            <p className="action-text">
                                Welcome! Please log in to access your protected content.
                            </p>
                            <LoginButton />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}