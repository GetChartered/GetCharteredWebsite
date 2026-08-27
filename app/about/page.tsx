import type { Metadata } from "next";
import { BadgeCheck, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AmbientBlob } from "@/components/AmbientBlob";

export const metadata: Metadata = {
  title: "About Us | GetChartered",
  description:
    "GetChartered exists to make professional qualification revision more accessible, affordable and convenient. Learn about our mission and the story behind the platform.",
};

// Short phrases pulled directly from the "why we built this" copy below —
// not new content, a visual restating of what the paragraphs already say,
// so the two-column split reads as one story rather than two competing ones.
const HIGHLIGHTS = [
  {
    icon: Users,
    text: "Guided by the candidates actually living this — not built in isolation",
  },
  {
    icon: Sparkles,
    text: "Personalised learning that adapts to what you know and shows you where you stand",
  },
  {
    icon: ShieldCheck,
    text: "Content held to the same standard as the profession you're entering",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div style={{ position: "relative", overflow: "hidden" }}>
        <AmbientBlob
          style={{
            width: 560,
            height: 560,
            top: -160,
            right: "-12%",
            background:
              "radial-gradient(circle, #0F9BAF 0%, rgba(15,155,175,0) 70%)",
          }}
          duration={11}
        />
        <AmbientBlob
          style={{
            width: 460,
            height: 460,
            top: 620,
            left: "-14%",
            background:
              "radial-gradient(circle, #009D9E 0%, rgba(0,157,158,0) 70%)",
          }}
          duration={13}
          delay={1.2}
        />
        <AmbientBlob
          style={{
            width: 420,
            height: 420,
            top: 1500,
            right: "-10%",
            background:
              "radial-gradient(circle, #0F9BAF 0%, rgba(15,155,175,0) 70%)",
          }}
          duration={10}
          delay={0.6}
        />

        {/* Hero — left-aligned, not centred; headline gets its own larger
            type step (.text-hero) so it reads as a clear step above the
            sub-line rather than the same size, different colour. */}
        <section className="about-hero-section" style={{ position: "relative", zIndex: 1 }}>
          <div className="container" style={{ position: "relative" }}>
            <ScrollReveal>
              <div style={{ maxWidth: 720 }}>
                <span className="text-eyebrow mb-4" style={{ display: "block" }}>
                  About GetChartered
                </span>
                <h1 className="text-hero mb-6" style={{ color: "var(--color-text)" }}>
                  Traditional exams aren&apos;t built for modern lives. Careers,
                  commutes, commitments. Something had to change.
                </h1>
                <p className="text-lead" style={{ color: "var(--color-text-secondary)" }}>
                  GetChartered — a Pass Professional Qualifications Limited
                  product.
                </p>
              </div>
            </ScrollReveal>
            <HeroGraphic />
          </div>
        </section>

        {/* Mission — asymmetric pull-quote: thin teal rule + oversized
            decorative quote mark, offset to the right of centre rather than
            boxed in a full-width colour band. */}
        <section className="about-mission-section" style={{ position: "relative", zIndex: 1 }}>
          <div className="container">
            <ScrollReveal>
              <div
                className="about-mission-quote"
                style={{ maxWidth: 700, position: "relative" }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -6,
                    left: -34,
                    fontSize: 88,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: "rgba(0, 157, 158, 0.22)",
                    userSelect: "none",
                  }}
                >
                  &ldquo;
                </span>
                <p
                  style={{
                    position: "relative",
                    borderLeft: "4px solid",
                    borderImage:
                      "linear-gradient(180deg, #0F9BAF, #009D9E) 1",
                    paddingLeft: 28,
                    fontSize: "clamp(1.4rem, 1rem + 1.6vw, 2.15rem)",
                    fontWeight: 600,
                    lineHeight: 1.45,
                    color: "var(--color-text)",
                  }}
                >
                  Our mission is simple: make professional qualification
                  revision more accessible, affordable and convenient — with
                  personalised learning that fits around your career, your
                  commute and your commitments, so you feel confident not
                  just in the exam, but in your profession.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Story — genuine two-column split: body copy on the left, short
            highlight cards pulled from that same copy on the right, instead
            of one more centred column stacked under the last one. */}
        <section className="about-story-section" style={{ position: "relative", zIndex: 1 }}>
          <div className="container">
            <div className="about-story-grid" style={{ alignItems: "start" }}>
              <ScrollReveal>
                <div>
                  <span className="text-eyebrow" style={{ display: "block", marginBottom: 12 }}>
                    Our story
                  </span>
                  <h2 className="text-display mb-6" style={{ color: "var(--color-text)" }}>
                    Why we built this
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
                      Some of the hardest exams in professional life are sat by
                      the people with the least time to prepare for them.
                    </p>
                    <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
                      Full days at work, then revision squeezed into evenings,
                      weekends and commutes — often expensive, often
                      inflexible, and with no real way of knowing whether any
                      of it is enough. We heard it again and again from those
                      going through it: the anxiety, the lack of time, and the
                      constant guessing about whether they&apos;d done enough.
                    </p>
                    <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
                      So we built the thing they deserved. GetChartered
                      wasn&apos;t built by us in isolation, it was guided by
                      the candidates living this, shaping what the platform is
                      and how it works. Personalised learning that adapts to
                      what you know and shows you exactly where you stand.
                      Revision that fits into the time you actually have.
                      Content built with the precision these professions
                      demand, because you&apos;ll be trusted with things that
                      matter, and your preparation should be held to the same
                      standard.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <div className="space-y-4">
                {HIGHLIGHTS.map((item, i) => (
                  <ScrollReveal key={item.text} delay={0.12 + i * 0.1} y={18}>
                    <div
                      className="card card-hover"
                      style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 18 }}
                    >
                      <div
                        className="rounded-full flex items-center justify-center"
                        style={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          backgroundColor: "rgba(0, 157, 158, 0.12)",
                        }}
                      >
                        <item.icon size={19} style={{ color: "#009D9E" }} />
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          lineHeight: 1.5,
                          color: "var(--color-text)",
                        }}
                      >
                        {item.text}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ICAEW recognition — horizontal lockup read as a credibility badge:
          logo in its own framed plate beside the copy, premium dot-grid +
          gradient surface, more padding/weight than a plain disclaimer box. */}
      <section className="about-icaew-section" style={{ position: "relative", zIndex: 1 }}>
        <div className="container">
          <ScrollReveal>
            <div
              className="credibility-panel card"
              style={{
                borderColor: "rgba(0, 157, 158, 0.32)",
                padding: "32px 28px",
              }}
            >
              <div
                className="credibility-lockup"
                style={{ position: "relative", zIndex: 1 }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    padding: 16,
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--color-card)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <img
                    src="/icaew-partner-in-learning-logo.webp"
                    alt="ICAEW Partner in Learning"
                    className="icaew-logo"
                    style={{ height: "64px", width: "auto", objectFit: "contain" }}
                  />
                </div>
                <div>
                  <div
                    className="flex items-center credibility-lockup-badge-row"
                    style={{ gap: 6, marginBottom: 8 }}
                  >
                    <BadgeCheck size={16} style={{ color: "#009D9E" }} />
                    <span className="text-eyebrow">Industry Recognition</span>
                  </div>
                  <p
                    className="text-lg"
                    style={{ color: "var(--color-text)", fontWeight: 500 }}
                  >
                    GetChartered is a recognised ICAEW Partner in Learning for
                    CFAB, reflecting our commitment to quality and accuracy in
                    everything we build.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Abstract, decorative only — orbiting rings + a few nodes in the brand
// teals, filling the empty space beside the hero headline on wide
// viewports without competing with it (low opacity, no literal imagery).
function HeroGraphic() {
  return (
    <div
      className="hero-graphic"
      aria-hidden
      style={{
        position: "absolute",
        top: "50%",
        right: 0,
        transform: "translateY(-50%)",
        width: 360,
        height: 360,
        pointerEvents: "none",
      }}
    >
      <svg viewBox="0 0 400 400" width="100%" height="100%" fill="none">
        <circle cx="200" cy="200" r="170" stroke="#0F9BAF" strokeOpacity="0.16" />
        <circle cx="200" cy="200" r="120" stroke="#009D9E" strokeOpacity="0.2" />
        <circle cx="200" cy="200" r="70" stroke="#0F9BAF" strokeOpacity="0.24" />
        <line x1="240" y1="261" x2="320" y2="141" stroke="#0F9BAF" strokeOpacity="0.18" />
        <line x1="240" y1="261" x2="87" y2="241" stroke="#009D9E" strokeOpacity="0.14" />
        <circle cx="320" cy="141" r="6" fill="#0F9BAF" fillOpacity="0.5" />
        <circle cx="87" cy="241" r="5" fill="#009D9E" fillOpacity="0.45" />
        <circle cx="240" cy="261" r="7" fill="#009D9E" fillOpacity="0.55" />
        <circle cx="150" cy="110" r="4" fill="#0F9BAF" fillOpacity="0.4" />
      </svg>
    </div>
  );
}
