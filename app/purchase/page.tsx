"use client";
import React from 'react'
import LoginButton from "@/components/LoginButton";
import {auth0} from "@/lib/auth0";

export default async function purchasePage () {
    const session = await auth0.getSession();
    const user = session?.user;

    return (
        <div className="light">
            <div className="main-card-wrapper">
                <h1>Get Chartered</h1>
                <div className="action-card">
                    {user ? (
                        <div className="logged-in-section">
                            <h1>
                                This is the purchase page
                            </h1>
                            <form action="/api/checkout_sessions" method="POST">
                                <section>
                                    <button
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                                        type="submit" role="link">
                                        Checkout
                                    </button>
                                </section>
                            </form>

                        </div>
                    ) : (
                        <>
                            <p className="action-text">
                                Welcome! Please log in to access the purchase page
                            </p>
                            <LoginButton />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}