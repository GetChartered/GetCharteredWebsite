"use client";

// The site's feedback form — opened as a modal from the "Feedback" link in
// Navigation.tsx (via PracticeToolModal). Matches the app's Send Feedback
// screen (GetChartered_app's app/(protected)/(tabs)/profile/
// (accountinformation)/feedback.tsx); both post to app/api/feedback/route.ts.
// No outer card/border here — renders inside PracticeToolModal's own panel.

import { useState, type FormEvent } from "react";
import { Bug, CheckCircle2, Lightbulb, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui";

type Category = "bug" | "feature" | "general";

const CATEGORIES: { value: Category; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "Something's broken", icon: Bug },
  { value: "feature", label: "I have an idea", icon: Lightbulb },
  { value: "general", label: "General feedback", icon: MessageSquare },
];

// Which part of the app/site the feedback is about. Same list and labels
// as the app's feedback.tsx and backend/feedbackLambda's ALLOWED_AREAS —
// keep all three in sync if this changes.
type Area = "general" | "practice" | "progress" | "planner" | "leaderboard" | "profile";

const AREAS: { value: Area; label: string }[] = [
  { value: "general", label: "General" },
  { value: "practice", label: "Practice" },
  { value: "progress", label: "Progress" },
  { value: "planner", label: "Planner" },
  { value: "leaderboard", label: "Leaderboard" },
  { value: "profile", label: "Profile" },
];

const MAX_MESSAGE_LENGTH = 4000;

export function FeedbackForm({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [category, setCategory] = useState<Category>("bug");
  const [area, setArea] = useState<Area>("general");
  const [message, setMessage] = useState("");

  const trimmedLength = message.trim().length;
  const canSubmit = trimmedLength > 0 && trimmedLength <= MAX_MESSAGE_LENGTH && status !== "submitting";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim(), area }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error();
      setStatus("success");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "12px 0 4px" }}>
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: 48, height: 48, backgroundColor: "rgba(0, 157, 158, 0.12)" }}
        >
          <CheckCircle2 size={24} style={{ color: "#009D9E" }} />
        </div>
        <p style={{ fontWeight: 600, color: "var(--color-text)" }}>Thanks for the feedback</p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          We read every submission — any feedback helps us improve.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setStatus("idle")}>
            Send another
          </button>
          <Button variant="primary" size="sm" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label, icon: Icon }) => {
          const selected = category === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className="flex items-center gap-1.5"
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: selected ? 600 : 500,
                border: `1.5px solid ${selected ? "#009D9E" : "var(--color-border-subtle)"}`,
                backgroundColor: selected ? "rgba(0, 157, 158, 0.08)" : "transparent",
                color: selected ? "#009D9E" : "var(--color-text-secondary)",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>
          Which part of the site is this about?
        </p>
        <div className="flex flex-wrap gap-2">
          {AREAS.map(({ value, label }) => {
            const selected = area === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setArea(value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 16,
                  fontSize: 12.5,
                  fontWeight: selected ? 600 : 500,
                  border: `1.5px solid ${selected ? "#009D9E" : "var(--color-border-subtle)"}`,
                  backgroundColor: selected ? "rgba(0, 157, 158, 0.08)" : "transparent",
                  color: selected ? "#009D9E" : "var(--color-text-secondary)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <textarea
          name="message"
          required
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's working, what isn't, or what you'd like to see next..."
          className="textarea"
          style={{ minHeight: 140 }}
          maxLength={MAX_MESSAGE_LENGTH}
        />
      </div>

      {status === "error" && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }}>
          Something went wrong sending that — please try again in a moment.
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" size="lg" leftIcon={Send} loading={status === "submitting"} disabled={!canSubmit} fullWidth>
          Send Feedback
        </Button>
      </div>
    </form>
  );
}
