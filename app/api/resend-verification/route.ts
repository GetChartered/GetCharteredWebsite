import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getUserAccount, sendVerificationEmail } from "@/lib/auth0-management";

export async function POST() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // The session cookie's `email_verified` is stale until re-login, so check
  // the live value before triggering another job.
  let account;
  try {
    account = await getUserAccount(session.user.sub);
  } catch (error) {
    console.error("Resend verification: failed to load account", error);
    return NextResponse.json(
      { error: "Couldn't check your account status. Try again in a moment." },
      { status: 500 }
    );
  }

  if (account.email_verified) {
    return NextResponse.json({ alreadyVerified: true });
  }

  try {
    await sendVerificationEmail(session.user.sub);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send verification email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
