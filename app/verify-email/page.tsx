import { redirect } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { auth0 } from "@/lib/auth0";
import { getUserAccount } from "@/lib/auth0-management";
import { VerifyEmailForm } from "@/components/account/VerifyEmailForm";

export default async function VerifyEmailPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login?returnTo=/verify-email");
  }

  const account = await getUserAccount(session.user.sub);
  // Already verified — nothing to wait for; send them onward.
  if (account.email_verified) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <div
            style={{
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            <VerifyEmailForm email={account.email} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
