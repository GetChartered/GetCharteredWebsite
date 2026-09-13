import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Navigation />
      <main style={{ textAlign: "center", padding: "6rem 1rem 4rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>404</h1>
        <p style={{ color: "var(--text-secondary, #666)", marginBottom: "1.5rem" }}>
          This page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
