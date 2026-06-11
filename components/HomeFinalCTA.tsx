"use client";

import Link from "next/link";
import { User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui";
import { useOptionalUser } from "@/lib/useOptionalUser";

// Renders the bottom CTA section. Auth-aware copy + button live in a client
// component so the page itself can be statically prerendered.
export function HomeFinalCTA() {
  const { user, isLoading } = useOptionalUser();

  if (user) {
    return (
      <>
        <h2 className="text-display mb-6">You&apos;re on the Waitlist</h2>

        <p
          className="text-lg mb-8"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Thanks for signing up early. GetChartered launches in July 2026 —
          manage your account or get in touch with the team any time.
        </p>

        <Link href="/my-account" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg" leftIcon={User}>
            Go to My Account
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <h2 className="text-display mb-6">Be First in Line for Launch</h2>

      <p
        className="text-lg mb-8"
        style={{ color: "var(--color-text-secondary)" }}
      >
        GetChartered launches in July 2026. Sign up now to join the waitlist,
        get early access during our free beta, and help shape the product
        before it goes live.
      </p>

       {isLoading ? (
         <Button variant="primary" size="lg" leftIcon={UserPlus} disabled>
          Join the Waitlist
        </Button>
       ) : (
         <Link
           href="/auth/login?screen_hint=signup"
           prefetch={false}
           style={{ textDecoration: "none" }}
         >
           <Button variant="primary" size="lg" leftIcon={UserPlus}>
             Join the Waitlist
           </Button>
         </Link>
       )}

      <p
        className="text-sm mt-6"
        style={{ color: "var(--color-text-muted)" }}
      >
        Free during beta • Cancel anytime
      </p>
    </>
  );
}
