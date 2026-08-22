import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Us | GetChartered",
  description:
    "GetChartered exists to make professional qualification revision more accessible, affordable and convenient. Learn about our mission and the story behind the platform.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="py-24 text-center">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-display mb-6">
              Traditional exams aren&apos;t built for modern lives. Careers,
              commutes, commitments. Something had to change.
            </h1>
            <p
              className="text-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              GetChartered — a Pass Professional Qualifications Limited
              product.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section
        className="py-16"
        style={{
          background:
            "linear-gradient(135deg, rgba(0, 157, 158, 0.08), rgba(15, 155, 175, 0.08))",
        }}
      >
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <p
              className="text-2xl md:text-3xl"
              style={{
                color: "var(--color-text)",
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              Our mission is simple: make professional qualification revision
              more accessible, affordable and convenient — with personalised
              learning that fits around your career, your commute and your
              commitments, so you feel confident not just in the exam, but in
              your profession.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-display mb-8 text-center">
              Why we built this
            </h2>
            <div className="space-y-6">
              <p
                className="text-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Some of the hardest exams in professional life are sat by the
                people with the least time to prepare for them.
              </p>
              <p
                className="text-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Full days at work, then revision squeezed into evenings,
                weekends and commutes — often expensive, often inflexible, and
                with no real way of knowing whether any of it is enough. We
                heard it again and again from those going through it: the
                anxiety, the lack of time, and the constant guessing about
                whether they&apos;d done enough.
              </p>
              <p
                className="text-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                So we built the thing they deserved. GetChartered wasn&apos;t
                built by us in isolation, it was guided by the candidates
                living this, shaping what the platform is and how it works.
                Personalised learning that adapts to what you know and shows
                you exactly where you stand. Revision that fits into the time
                you actually have. Content built with the precision these
                professions demand, because you&apos;ll be trusted with
                things that matter, and your preparation should be held to
                the same standard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ICAEW recognition */}
      <section className="pb-24">
        <div className="container">
          <div
            className="card max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
            style={{
              borderColor: "rgba(0, 157, 158, 0.35)",
              backgroundColor: "rgba(0, 157, 158, 0.04)",
            }}
          >
            <img
              src="/icaew-partner-in-learning-logo.webp"
              alt="ICAEW Partner in Learning"
              className="icaew-logo"
              style={{ height: "72px", width: "auto", objectFit: "contain", flexShrink: 0 }}
            />
            <div>
              <p
                className="mb-1"
                style={{
                  color: "#009D9E",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Industry Recognition
              </p>
              <p style={{ color: "var(--color-text-secondary)" }}>
                GetChartered is a recognised ICAEW Partner in Learning for
                CFAB, reflecting our commitment to quality and accuracy in
                everything we build.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
