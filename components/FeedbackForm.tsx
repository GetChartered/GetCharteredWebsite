"use client";

// Netlify Forms convention: a plain HTML form with name + data-netlify="true"
// + a hidden form-name field, submitted as x-www-form-urlencoded to Netlify's
// form-handling endpoint. No API route/backend of our own is involved — see
// public/__forms.html for the static replica Netlify's build-time form
// crawler needs (this page is server-rendered per-request, so the live form
// markup below never appears in a build-time HTML snapshot for it to find).

import { useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button, Input } from "@/components/ui";

function encode(data: Record<string, string>): string {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join("&");
}

export function FeedbackForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "feedback", name, email, message }),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
          padding: 40,
        }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: 56, height: 56, backgroundColor: "rgba(0, 157, 158, 0.12)" }}
        >
          <CheckCircle2 size={28} style={{ color: "#009D9E" }} />
        </div>
        <h3 className="text-kpi-title" style={{ color: "var(--color-text)" }}>
          Thanks for the feedback
        </h3>
        <p style={{ color: "var(--color-text-secondary)" }}>
          We read every submission — it genuinely shapes what we build next.
        </p>
      </div>
    );
  }

  return (
    <form
      name="feedback"
      method="POST"
      data-netlify="true"
      onSubmit={handleSubmit}
      className="feedback-form"
    >
      <input type="hidden" name="form-name" value="feedback" />

      <div className="feedback-form-row">
        <Input
          label="Name (optional)"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          autoComplete="name"
        />
        <Input
          label="Email (optional)"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block font-semibold text-sm mb-2">Your feedback</label>
        <textarea
          name="message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's working, what isn't, or what you'd like to see next..."
          className="textarea"
        />
      </div>

      {status === "error" && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }}>
          Something went wrong sending that — please try again in a moment.
        </p>
      )}

      <div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={Send}
          loading={status === "submitting"}
        >
          Send Feedback
        </Button>
      </div>
    </form>
  );
}
