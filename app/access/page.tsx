"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function AccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the page they were trying to access or home
        const returnUrl = new URLSearchParams(window.location.search).get("returnUrl") || "/";
        router.push(returnUrl);
        router.refresh();
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-display mb-4">Access Required</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            This site is currently in development. Please enter the access password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                borderColor: "var(--color-border-primary)",
                color: "var(--color-text-primary)",
              }}
              placeholder="Enter password"
              required
              autoFocus
            />
          </div>

          {error && (
            <div
              className="text-sm p-3 rounded-lg"
              style={{
                backgroundColor: "var(--accent-red)20",
                color: "var(--accent-red)",
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Access Site"}
          </Button>
        </form>
      </div>
    </div>
  );
}
