"use client";

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function PracticeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Navigation />
      <main style={{ textAlign: "center", padding: "6rem 1rem 4rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Practice Error</h1>
        <p style={{ color: "var(--text-secondary, #666)", marginBottom: "1.5rem" }}>
          Something went wrong loading your practice session.
        </p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </main>
      <Footer />
    </>
  );
}
