"use server";

import CancelSubscription from "@/components/CancelSubscription";
import { auth0 } from "@/lib/auth0";
import { deleteUser } from "@/lib/auth0-management";
import { redirect } from "next/navigation";

export default async function DeleteAccount(formData: FormData) {
    const session = await auth0.getSession();

    if (!session) {
        redirect("/auth/login");
    }

    // Cancel subscription first (no-op if none exists or mocked)
    await CancelSubscription(formData);

    // Delete the Auth0 account
    await deleteUser(session.user.sub);

    // Log the user out and redirect home
    redirect("/auth/logout");
}