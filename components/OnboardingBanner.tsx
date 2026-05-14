"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { ONBOARDING_REQUIRED } from "@/lib/features";

const DISMISS_KEY = "onboarding_banner_dismissed";

export function OnboardingBanner() {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading || !user) {
      setShow(false);
      return;
    }
    if (pathname === "/onboarding" || pathname?.startsWith("/auth/")) {
      setShow(false);
      return;
    }

    // When onboarding is enforced server-side, dismissal makes no sense — the
    // user will just bounce off protected pages until they finish. Skip the
    // sessionStorage check entirely in that mode.
    if (!ONBOARDING_REQUIRED) {
      let dismissed = false;
      try {
        dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        // sessionStorage unavailable (e.g. private mode) — treat as not dismissed.
      }
      if (dismissed) return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.metadata?.onboarding_completed !== true) {
          setShow(true);
        }
      } catch {
        // Silent — banner just won't show.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, pathname]);

  if (!show) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label="Complete your profile"
      style={{
        borderBottom: "1px solid var(--color-border-subtle)",
        backgroundColor:
          "color-mix(in srgb, var(--accent-blue) 10%, var(--color-card))",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
            flexWrap: "wrap",
          }}
        >
          <Sparkles
            size={18}
            style={{ color: "var(--accent-blue)", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 14,
              color: "var(--color-text)",
              flex: 1,
              minWidth: 200,
            }}
          >
            {ONBOARDING_REQUIRED ? (
              <>
                <strong style={{ fontWeight: 600 }}>Finish setting up your account</strong>{" "}
                to access your dashboard.
              </>
            ) : (
              <>
                <strong style={{ fontWeight: 600 }}>Welcome!</strong> Tell us a
                bit about yourself so we can personalise your experience.
              </>
            )}
          </span>
          <Link
            href="/onboarding"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            {ONBOARDING_REQUIRED ? "Continue" : "Get started"}
            <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Link>
          {!ONBOARDING_REQUIRED && (
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                color: "var(--color-text-muted)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
