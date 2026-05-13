"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import DeleteAccount from "@/components/DeleteAccount";

const REASONS = [
  { value: "I no longer need it", label: "I no longer need it" },
  { value: "Too expensive", label: "Too expensive" },
  { value: "Missing features", label: "Missing features" },
  { value: "Other", label: "Other" },
] as const;

export function DeleteAccountForm({ email }: { email: string }) {
  const [reason, setReason] = useState<string>("");
  const [otherDetail, setOtherDetail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the user's Auth0 record has no email (rare — some social providers can
  // omit it), fall back to typing the literal word DELETE so the safety check
  // doesn't lock them out of their own deletion flow.
  const hasEmail = email.trim().length > 0;
  const expected = hasEmail ? email.trim().toLowerCase() : "delete";
  const normalizedConfirm = confirmEmail.trim().toLowerCase();
  const emailMatches = normalizedConfirm.length > 0 && normalizedConfirm === expected;

  const handleSubmit = async () => {
    if (!emailMatches || submitting) return;
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    const reasonPayload =
      reason === "Other" && otherDetail.trim()
        ? `Other: ${otherDetail.trim()}`
        : reason;
    if (reasonPayload) formData.append("reason", reasonPayload);

    try {
      const result = await DeleteAccount(formData);
      if (result.success) {
        // The server action already cleared the session cookie, so a plain
        // navigation home is enough — full reload so useUser() re-reads state.
        window.location.href = "/";
        return;
      }
      setError(result.error);
      setSubmitting(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="card"
      style={{ padding: "32px", maxWidth: 520, width: "100%" }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertTriangle size={28} style={{ color: "#ef4444" }} />
        </div>
        <h1
          className="text-title"
          style={{ fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}
        >
          Delete your account
        </h1>
        <p
          className="text-body"
          style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}
        >
          This action is permanent. All your data, subscription, and progress
          will be removed and can&apos;t be recovered.
        </p>
      </div>

      {/* Reason */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--color-text)",
            marginBottom: 12,
          }}
        >
          Why are you leaving?{" "}
          <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
            (optional)
          </span>
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {REASONS.map((opt) => {
            const isSelected = reason === opt.value;
            return (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${
                    isSelected
                      ? "var(--color-tint)"
                      : "var(--color-border-subtle)"
                  }`,
                  backgroundColor: isSelected
                    ? "color-mix(in srgb, var(--color-tint) 6%, var(--color-card))"
                    : "var(--color-card)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="radio"
                  name="reason"
                  value={opt.value}
                  checked={isSelected}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ accentColor: "var(--color-tint)" }}
                />
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--color-text)",
                  }}
                >
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>

        {reason === "Other" && (
          <textarea
            value={otherDetail}
            onChange={(e) => setOtherDetail(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Tell us more (optional)..."
            style={{
              marginTop: 12,
              width: "100%",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-subtle)",
              backgroundColor: "var(--color-card)",
              color: "var(--color-text)",
              fontFamily: "inherit",
              fontSize: 14,
              resize: "vertical",
              outline: "none",
            }}
          />
        )}
      </div>

      {/* Type-to-confirm */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--color-text)",
            marginBottom: 8,
          }}
        >
          {hasEmail ? "To confirm, type your email:" : "To confirm, type DELETE:"}{" "}
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
            {hasEmail ? email : "DELETE"}
          </span>
        </label>
        <input
          type={hasEmail ? "email" : "text"}
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder={hasEmail ? "you@example.com" : "DELETE"}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${
              confirmEmail.length === 0
                ? "var(--color-border-subtle)"
                : emailMatches
                ? "#22c55e"
                : "rgba(239, 68, 68, 0.5)"
            }`,
            backgroundColor: "var(--color-card)",
            color: "var(--color-text)",
            fontFamily: "inherit",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Button
          variant="danger"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!emailMatches || submitting}
          onClick={handleSubmit}
        >
          Permanently delete account
        </Button>
        <Link
          href="/my-account"
          className="btn btn-outline btn-lg btn-full"
          style={{
            textDecoration: "none",
            textAlign: "center",
            pointerEvents: submitting ? "none" : "auto",
            opacity: submitting ? 0.5 : 1,
          }}
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
