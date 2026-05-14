import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LegalContent } from "@/components/LegalContent";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />
      <main className="container py-12">
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            backgroundColor: "var(--color-card)",
            borderRadius: "var(--radius-xxl)",
            padding: "48px",
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <LegalContent source="/privacypolicy.html" />
        </div>
      </main>
      <Footer />
    </>
  );
}
