"use client";

import Link from "next/link";
import { Mail, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui";
import { useOptionalUser } from "@/lib/useOptionalUser";

// Renders the hero CTA buttons. Lives in a client component so the surrounding
// page can be statically prerendered — session is resolved on the client via
// SWR rather than blocking server render on a getOptionalSession() call.
export function HomeHeroCTA() {
  const { user } = useOptionalUser();

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {user ? (
        <Link href="/my-account" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg" leftIcon={User}>
            Go to My Account
          </Button>
        </Link>
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
      <Link href="/contact" style={{ textDecoration: "none" }}>
        <Button variant="outline" size="lg" leftIcon={Mail}>
          Contact Us
        </Button>
      </Link>
    </div>
  );
}
