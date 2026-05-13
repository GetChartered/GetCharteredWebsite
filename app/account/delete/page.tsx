import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";

export default async function Delete() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login?returnTo=/account/delete");
  }

  const email = session.user.email || "";

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DeleteAccountForm email={email} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
