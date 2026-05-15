import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { getUserMetadata, type OnboardingMetadata } from "@/lib/auth0-management";

export default async function WelcomePage() {
  const session = await requireOnboardedSession("/welcome");
  const metadata: OnboardingMetadata = await getUserMetadata(session.user.sub).catch(() => ({}));
  const firstName = (metadata.full_name || session.user.name || "")
    .toString()
    .trim()
    .split(/\s+/)[0];

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                backgroundColor: "rgba(34, 197, 94, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <CheckCircle2 size={40} style={{ color: "#22c55e" }} />
            </div>

            <h1
              className="text-display mb-4"
              style={{ color: "var(--color-text)" }}
            >
              {firstName
                ? `Welcome to GetChartered, ${firstName}!`
                : "Welcome to GetChartered!"}
            </h1>

            <p
              className="text-body"
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: 32,
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              You&apos;re all set up. GetChartered launches publicly in July
              2026. We&apos;ll be in touch when there&apos;s news, and your
              account&apos;s ready whenever the practice modules go live.
            </p>

            <div
              className="card"
              style={{
                padding: 24,
                textAlign: "left",
                marginBottom: 32,
              }}
            >
              <h3
                className="text-kpi-title mb-4"
                style={{ color: "var(--color-text)", fontWeight: 600 }}
              >
                What&apos;s next?
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <WelcomeBullet>
                  We&apos;ll email you when practice questions and mock exams
                  go live.
                </WelcomeBullet>
                <WelcomeBullet>
                  Update your details any time from{" "}
                  <Link
                    href="/my-account"
                    style={{
                      color: "var(--color-tint)",
                      textDecoration: "underline",
                    }}
                  >
                    My Account
                  </Link>
                  .
                </WelcomeBullet>
              </ul>
            </div>

            <Link
              href="/my-account"
              className="btn btn-primary btn-lg"
              style={{ textDecoration: "none" }}
            >
              Go to My Account
              <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function WelcomeBullet({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        fontSize: 14,
        color: "var(--color-text-secondary)",
        lineHeight: 1.5,
      }}
    >
      <span
        style={{
          color: "var(--color-success, #22c55e)",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
