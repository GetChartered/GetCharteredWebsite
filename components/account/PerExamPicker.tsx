"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { PracticeExamGroup } from "@/lib/practice/types";

// Lets a user pick exactly one ACA exam and buy access to just that exam
// (£25 one-off — see PRELAUNCH_TIERS in PricingSection.tsx). Split out from
// SubscribeButtons.tsx because, unlike Annual, this plan needs an examId
// before checkout can even be attempted — there's no sensible "auto-fire on
// arrival" flow the way Annual has.
//
// `exams` comes from the server (my-account/page.tsx calling
// fetchAcaCourseData(), same live GET /courses-backed helper the planner
// page already uses) — never hardcoded here, so this always reflects
// whatever exams the backend actually serves.
interface PerExamPickerProps {
  exams: PracticeExamGroup[];
}

export function PerExamPicker({ exams }: PerExamPickerProps) {
  const { showToast } = useToast();
  const [selectedExamCode, setSelectedExamCode] = useState(exams[0]?.code ?? "");
  const [loading, setLoading] = useState(false);

  if (exams.length === 0) {
    // Shouldn't normally happen (ACA always has exams once the backend is
    // reachable), but fetchAcaCourseData() can return an empty list if
    // GET /courses is briefly unreachable — better an honest empty state
    // than a picker with nothing to pick.
    return (
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Couldn&apos;t load the exam list right now — refresh the page to try again.
      </p>
    );
  }

  const buyExam = async () => {
    if (!selectedExamCode) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "per_exam", examId: selectedExamCode }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || typeof data?.url !== "string") {
        throw new Error(typeof data?.error === "string" ? data.error : "Checkout failed");
      }

      window.location.href = data.url;
    } catch (error) {
      setLoading(false);
      showToast(error instanceof Error ? error.message : "Couldn't start checkout", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", width: "100%", maxWidth: 320, margin: "0 auto" }}>
      <select
        value={selectedExamCode}
        onChange={(e) => setSelectedExamCode(e.target.value)}
        disabled={loading}
        className="input"
        style={{ width: "100%" }}
        aria-label="Choose which exam to buy"
      >
        {exams.map((exam) => (
          <option key={exam.code} value={exam.code}>
            {exam.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={loading || !selectedExamCode}
        onClick={buyExam}
        style={{ minWidth: 220 }}
      >
        {loading ? "Redirecting to Stripe…" : "Buy this exam — £25"}
      </button>
    </div>
  );
}
