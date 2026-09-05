"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

// Replaces the old <form action="/api/checkout_sessions"> single-price
// submit button — that route only ever supported one hardcoded Stripe price
// and its webhook never wrote anything anywhere (see claude/launch-todo-list.md
// item 9). This calls the new proxy (app/api/stripe/checkout/route.ts ->
// Lambda stripeCreateCheckoutSession) which supports monthly/annual/per_exam
// distinctly and actually updates the user's entitlement on completion.
//
// Per-exam purchases aren't offered here — they need an examId (which exam
// paper), which only makes sense from an exam-specific context (e.g. a
// locked exam's own page), not this general account-page subscribe card.
const PLANS = [
  { key: "monthly" as const, label: "Monthly — £15/mo" },
  { key: "annual" as const, label: "Annual — £100/yr (Best Value)" },
];

interface SubscribeButtonsProps {
  // Set when the user arrived here via a landing-page pricing card click
  // (?subscribe=monthly|annual — see PricingSection.tsx and
  // app/my-account/page.tsx, which thread this through a login/signup round
  // trip if needed). Auto-fires checkout for that plan on mount so "click
  // Subscribe on the pricing page" goes straight to Stripe instead of
  // making an already-decided user click a second button.
  autoSubscribePlan?: "monthly" | "annual";
}

export function SubscribeButtons({ autoSubscribePlan }: SubscribeButtonsProps = {}) {
  const { showToast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const autoFired = useRef(false);

  const subscribe = async (plan: "monthly" | "annual") => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || typeof data?.url !== "string") {
        throw new Error(typeof data?.error === "string" ? data.error : "Checkout failed");
      }

      window.location.href = data.url;
    } catch (error) {
      setLoadingPlan(null);
      showToast(error instanceof Error ? error.message : "Couldn't start checkout", "error");
    }
  };

  useEffect(() => {
    if (autoSubscribePlan && !autoFired.current) {
      autoFired.current = true;
      void subscribe(autoSubscribePlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubscribePlan]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      {PLANS.map((p) => (
        <button
          key={p.key}
          type="button"
          className="btn btn-primary btn-sm"
          disabled={loadingPlan !== null}
          onClick={() => subscribe(p.key)}
          style={{ minWidth: 220 }}
        >
          {loadingPlan === p.key ? "Redirecting to Stripe…" : p.label}
        </button>
      ))}
    </div>
  );
}
