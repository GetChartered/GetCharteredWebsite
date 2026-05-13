"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

const POLL_INTERVAL_MS = 5000;

type ResendStatus = "idle" | "sending" | "sent" | "error";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  // Live ref so the polling interval always reads the latest checking state
  // without recreating the effect.
  const checkingRef = useRef(checking);
  checkingRef.current = checking;

  const checkStatus = useCallback(
    async (options: { showFeedback: boolean }) => {
      try {
        const res = await fetch("/api/onboarding", { cache: "no-store" });
        if (!res.ok) return false;
        const data = await res.json();
        if (data?.email_verified === true) {
          router.push("/onboarding");
          return true;
        }
        if (options.showFeedback) {
          setCheckMessage(
            "Not verified yet — click the link in the email we sent you, then try again."
          );
        }
        return false;
      } catch {
        if (options.showFeedback) {
          setCheckMessage("Couldn't check status. Try again in a moment.");
        }
        return false;
      }
    },
    [router]
  );

  // Auto-poll every few seconds while the tab is visible. Pauses when hidden
  // to avoid burning Management API quota on background tabs, resumes on focus.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (!checkingRef.current) {
          checkStatus({ showFeedback: false });
        }
      }, POLL_INTERVAL_MS);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [checkStatus]);

  const handleResend = async () => {
    setResendStatus("sending");
    setResendError(null);
    try {
      const res = await fetch("/api/resend-verification", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send verification email");
      }
      setResendStatus("sent");
    } catch (err) {
      setResendError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setResendStatus("error");
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    setCheckMessage(null);
    await checkStatus({ showFeedback: true });
    setChecking(false);
  };

  return (
    <div className="card" style={{ padding: 32 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Mail size={28} style={{ color: "var(--accent-gold, #f59e0b)" }} />
        </div>
        <h1
          className="text-title"
          style={{ fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}
        >
          Verify your email
        </h1>
        <p
          className="text-body"
          style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}
        >
          We&apos;ve sent a verification link to{" "}
          <strong style={{ color: "var(--color-text)" }}>{email}</strong>.
          Click the link to continue setting up your account.
        </p>
      </div>

      {resendStatus === "sent" && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
            fontSize: 14,
          }}
        >
          Verification email sent. Check your inbox.
        </div>
      )}

      {resendStatus === "error" && resendError && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: 14,
          }}
        >
          {resendError}
        </div>
      )}

      {checkMessage && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "var(--color-text)",
            fontSize: 14,
          }}
        >
          {checkMessage}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleManualCheck}
          loading={checking}
        >
          I&apos;ve verified my email
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={handleResend}
          loading={resendStatus === "sending"}
          disabled={resendStatus === "sending"}
        >
          Resend verification email
        </Button>
      </div>

      <p
        style={{
          marginTop: 20,
          fontSize: 12,
          color: "var(--color-text-muted)",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        <Loader2
          size={11}
          className="animate-spin"
          style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}
        />
        Checking automatically every few seconds.{" "}
        <Link
          href="/auth/logout"
          style={{
            color: "var(--color-text-muted)",
            textDecoration: "underline",
          }}
        >
          Sign out
        </Link>
      </p>
    </div>
  );
}
