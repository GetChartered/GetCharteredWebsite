import {
  Play,
  Mail,
  UserPlus,
  BadgeCheck,
  Clock,
  Radar,
  PoundSterling,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/PricingSection";
import { FeedbackForm } from "@/components/FeedbackForm";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AmbientBlob } from "@/components/AmbientBlob";
import { HeroGraphic } from "@/components/HeroGraphic";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";
import { getOptionalSession } from "@/lib/auth0";

// Enterprise pitch highlights — mirrors /about's HIGHLIGHTS pattern: short
// cards standing beside the pitch copy rather than a separate features grid.
const ENTERPRISE_HIGHLIGHTS = [
  {
    icon: Clock,
    text: "Fewer hours lost to trainees stuck re-covering the same weak topics",
  },
  {
    icon: Radar,
    text: "Early visibility on at-risk candidates, well before exam day",
  },
  {
    icon: PoundSterling,
    text: "Lower cost from fewer resits and fewer study-leave days taken",
  },
];

export default async function Home() {
  const session = await getOptionalSession();
  const isLoggedIn = !!session;

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
            width: 420,
            height: 420,
            top: 560,
            left: "-14%",
            background:
              "radial-gradient(circle, #009D9E 0%, rgba(0,157,158,0) 70%)",
          }}
          duration={13}
          delay={1.2}
        />

        {/* Hero — left-aligned, asymmetric, abstract graphic on the right;
            same treatment as /about's hero so the two pages read as one
            design system. */}
        <section className="home-hero-section" style={{ position: "relative", zIndex: 1 }}>
          <div className="container" style={{ position: "relative" }}>
            <ScrollReveal>
              <div style={{ maxWidth: 640 }}>
                <span className="text-eyebrow mb-4" style={{ display: "block" }}>
                  GetChartered
                </span>

                {/* AWAITING HUGO'S FINAL STRAPLINE */}
                <h1 className="text-hero mb-6" style={{ color: "var(--color-text)" }}>
                  Smart revision for professional qualifications. Built
                  around your life.
                </h1>

                {/* AWAITING HUGO'S FINAL STRAPLINE */}
                <p className="text-lead mb-8" style={{ color: "var(--color-text-secondary)" }}>
                  Personalised practice that adapts to what you know, fits
                  into the time you have, and shows you exactly where you
                  stand.
                </p>

                {SUBSCRIPTIONS_ENABLED ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="primary" size="lg" leftIcon={Play}>
                      Start Free Trial
                    </Button>
                    <Link href="/contact" style={{ textDecoration: "none" }}>
                      <Button variant="outline" size="lg" leftIcon={Mail}>
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {isLoggedIn ? (
                      <Link href="/practice" style={{ textDecoration: "none" }}>
                        <Button variant="primary" size="lg" leftIcon={Play}>
                          Start Practicing
                        </Button>
                      </Link>
                    ) : (
                      <Link
                        href="/auth/login?screen_hint=signup"
                        style={{ textDecoration: "none" }}
                      >
                        <Button variant="primary" size="lg" leftIcon={UserPlus}>
                          Join the Waitlist
                        </Button>
                      </Link>
                    )}
                    <Link href="/contact" style={{ textDecoration: "none" }}>
                      <Button variant="outline" size="lg" leftIcon={Mail}>
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </ScrollReveal>
            <HeroGraphic />
          </div>
        </section>
      </div>

      {/* ICAEW recognition — same credibility-panel/lockup treatment as
          /about's ICAEW section, wording scoped to the operating company
          rather than the "GetChartered" brand for legal precision. */}
      <section className="home-icaew-section" style={{ position: "relative", zIndex: 1 }}>
        <div className="container">
          <ScrollReveal>
            <div
              className="credibility-panel card"
              style={{
                borderColor: "rgba(0, 157, 158, 0.32)",
                padding: "32px 28px",
              }}
            >
              <div className="credibility-lockup" style={{ position: "relative", zIndex: 1 }}>
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
                  <p className="text-lg" style={{ color: "var(--color-text)", fontWeight: 500 }}>
                    Pass Professional Qualifications Limited, the company
                    behind GetChartered, is a recognised ICAEW Partner in
                    Learning for CFAB.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Demo video — placeholder frame only; DemoVideoPlaceholder takes an
          optional videoSrc/embed prop so a real recording can replace the
          play-button state later without restructuring this section. */}
      <section className="home-demo-section" style={{ position: "relative", zIndex: 1 }}>
        <div className="container">
          <ScrollReveal>
            <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", marginBottom: 32 }}>
              <span className="text-eyebrow mb-3" style={{ display: "block" }}>
                See It In Action
              </span>
              <h2 className="text-display" style={{ color: "var(--color-text)" }}>
                Watch how GetChartered works
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <DemoVideoPlaceholder />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing — PricingSection owns its own "coming soon" styling now,
          restyled to match this page rather than a flat centred block. */}
      <PricingSection />

      {/* Enterprise / firms — B2B pitch, same asymmetric copy+cards split
          as /about's "Our story" section. */}
      <section className="home-enterprise-section" style={{ position: "relative", zIndex: 1 }}>
        <div className="container">
          <div className="home-enterprise-grid">
            <ScrollReveal>
              <div>
                <span className="text-eyebrow" style={{ display: "block", marginBottom: 12 }}>
                  For Firms
                </span>
                <h2 className="text-display mb-6" style={{ color: "var(--color-text)" }}>
                  Give your trainees a better route to chartered status
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
                    Every trainee who struggles through revision is time away
                    from client work — and every resit is a repeat cost in
                    fees, study leave and lost productivity. GetChartered is
                    built to reduce both.
                  </p>
                  <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
                    Personalised, adaptive practice keeps your people
                    revising efficiently instead of re-covering ground they
                    already know, and gives you visibility on who&apos;s
                    genuinely exam-ready and who needs support — early enough
                    to actually act on it.
                  </p>
                </div>
                <div className="mt-8">
                  <Link href="/contact" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="lg" leftIcon={Mail}>
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {ENTERPRISE_HIGHLIGHTS.map((item, i) => (
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

      {/* Feedback — Netlify Forms, no backend of our own; see
          components/FeedbackForm.tsx and public/__forms.html. */}
      <section className="home-feedback-section bg-muted" style={{ position: "relative", zIndex: 1 }}>
        <div className="container">
          <ScrollReveal>
            <div style={{ maxWidth: 620, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <span className="text-eyebrow mb-3" style={{ display: "block" }}>
                  Tell Us What You Think
                </span>
                <h2 className="text-display mb-4" style={{ color: "var(--color-text)" }}>
                  Help shape GetChartered
                </h2>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  We&apos;re building this with candidates, not just for them.
                  Good, bad or somewhere in between — we want to hear it.
                </p>
              </div>
              <div className="card" style={{ padding: 32 }}>
                <FeedbackForm />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Disclosure — deliberately understated small print, not a full
          visual section: a bordered strip rather than a card or callout. */}
      <section className="home-disclosure-section">
        <div className="container">
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              GetChartered is a product of Pass Professional Qualifications
              Limited.
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              By using our platform we cannot guarantee that you will pass
              your exams and by no means can grant any form of
              qualification — we are a revision platform, not the governing
              exam board.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Video placeholder — styled frame + play button + label standing in for a
// real recording. Swap this component's contents for a <video>/<iframe>
// when the asset exists; the section around it doesn't need to change.
function DemoVideoPlaceholder() {
  return (
    <div className="demo-video-frame">
      <svg
        aria-hidden
        viewBox="0 0 400 225"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
        fill="none"
      >
        <circle cx="40" cy="30" r="70" stroke="#0F9BAF" strokeOpacity="0.14" />
        <circle cx="370" cy="200" r="90" stroke="#009D9E" strokeOpacity="0.16" />
        <line x1="0" y1="180" x2="160" y2="60" stroke="#0F9BAF" strokeOpacity="0.1" />
      </svg>
      <div className="demo-play-button" style={{ position: "relative" }}>
        <Play size={28} fill="currentColor" style={{ marginLeft: 3 }} />
      </div>
      <span
        className="text-eyebrow"
        style={{ position: "relative", color: "var(--color-text-secondary)" }}
      >
        Demo coming soon
      </span>
    </div>
  );
}
