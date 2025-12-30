import { auth0 } from "@/lib/auth0";
import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import React from 'react'
import Link from "next/link";
import Profile from "@/components/Profile";
import GCProfile from "@/components/GCProfile";
import Footer from "@/components/Footer";

export default async function Home() {
    const session = await auth0.getSession();
    const user = session?.user;

    return (

        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <div className="light">
                        <div className="main-card-wrapper">
                            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                                Get Chartered
                            </h1>
                            <div className="action-card">
                                {user ? (
                                    <div className="logged-in-section">
                                        <Profile />
                                        <GCProfile />
                                        <br></br>
                                        <LogoutButton />
                                        <br></br>
                                    </div>
                                ) : (
                                    <>
                                        <p className="action-text">
                                            Please log in to access your account details.
                                        </p>
                                        <LoginButton />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <br></br>
                <Footer/>
            </main>
        </div>
    );
}