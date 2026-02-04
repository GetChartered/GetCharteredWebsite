"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    // Fetch the terms HTML
    fetch("/terms.html")
      .then((response) => response.text())
      .then((html) => setHtmlContent(html))
      .catch((error) => console.error("Error loading terms:", error));
  }, []);

  return (
    <>
      <Navigation />
      <main className="container py-12">
        <div
          className="legal-content"
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
          <div
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{ lineHeight: "1.6" }}
          />
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .legal-content :global([data-custom-class="title"]),
        .legal-content :global([data-custom-class="title"] *) {
          color: var(--color-text) !important;
          font-family: var(--font-family) !important;
          font-size: 32px !important;
          font-weight: 700 !important;
          margin-bottom: 16px !important;
        }

        .legal-content :global([data-custom-class="subtitle"]),
        .legal-content :global([data-custom-class="subtitle"] *) {
          color: var(--color-text-secondary) !important;
          font-family: var(--font-family) !important;
          font-size: 14px !important;
          margin-bottom: 32px !important;
        }

        .legal-content :global([data-custom-class="heading_1"]),
        .legal-content :global([data-custom-class="heading_1"] *),
        .legal-content :global(h1) {
          color: var(--color-text) !important;
          font-family: var(--font-family) !important;
          font-size: 24px !important;
          font-weight: 600 !important;
          margin-top: 32px !important;
          margin-bottom: 16px !important;
        }

        .legal-content :global([data-custom-class="heading_2"]),
        .legal-content :global([data-custom-class="heading_2"] *),
        .legal-content :global(h2) {
          color: var(--color-text) !important;
          font-family: var(--font-family) !important;
          font-size: 20px !important;
          font-weight: 600 !important;
          margin-top: 24px !important;
          margin-bottom: 12px !important;
        }

        .legal-content :global([data-custom-class="body_text"]),
        .legal-content :global([data-custom-class="body_text"] *),
        .legal-content :global(p),
        .legal-content :global(li),
        .legal-content :global(span) {
          color: var(--color-text-secondary) !important;
          font-family: var(--font-family) !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }

        .legal-content :global([data-custom-class="link"]),
        .legal-content :global([data-custom-class="link"] *),
        .legal-content :global(a) {
          color: var(--color-tint) !important;
          font-family: var(--font-family) !important;
          font-size: 14px !important;
          text-decoration: underline !important;
        }

        .legal-content :global(a:hover) {
          color: var(--color-tint-hover) !important;
        }

        .legal-content :global(ul),
        .legal-content :global(ol) {
          padding-left: 24px !important;
          margin: 16px 0 !important;
        }

        .legal-content :global(li) {
          margin-bottom: 8px !important;
        }

        .legal-content :global(table) {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 24px 0 !important;
        }

        .legal-content :global(td),
        .legal-content :global(th) {
          border: 1px solid var(--color-border-subtle) !important;
          padding: 12px !important;
          color: var(--color-text-secondary) !important;
        }

        .legal-content :global(th) {
          background-color: var(--color-background-muted) !important;
          color: var(--color-text) !important;
          font-weight: 600 !important;
        }

        .legal-content :global(.MsoNormal) {
          margin: 8px 0 !important;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .legal-content :global([data-custom-class="title"]),
          .legal-content :global([data-custom-class="title"] *) {
            font-size: 24px !important;
          }

          .legal-content :global([data-custom-class="heading_1"]),
          .legal-content :global([data-custom-class="heading_1"] *),
          .legal-content :global(h1) {
            font-size: 20px !important;
          }

          .legal-content :global([data-custom-class="heading_2"]),
          .legal-content :global([data-custom-class="heading_2"] *),
          .legal-content :global(h2) {
            font-size: 18px !important;
          }
        }
      `}</style>
    </>
  );
}
