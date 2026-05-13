import { Play, BookOpen, BarChart3, Medal, Mail, UserPlus, User, LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/PricingSection";
import { ViewPricingButton } from "@/components/ViewPricingButton";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";
import { requireVerifiedIfSignedIn } from "@/lib/auth0";

export default async function Home() {
  // If signed in but unverified, this redirects to /verify-email — keeping
  // the user locked into the verify flow until they confirm their email.
  const session = await requireVerifiedIfSignedIn();
  const isLoggedIn = !!session;
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="py-24 text-center">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-display mb-6">
              Master Your Professional Exams
            </h1>

            <p
              className="text-lg mb-8"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Practice questions for your ACA, ACCA, CISI, and CII exams with
              our intelligent learning platform.
            </p>

            {SUBSCRIPTIONS_ENABLED ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" leftIcon={Play}>
                  Start Free Trial
                </Button>

                <ViewPricingButton />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isLoggedIn ? (
                  <Link href="/my-account" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="lg" leftIcon={User}>
                      Go to My Account
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-display mb-4">
              Everything You Need to Succeed
            </h2>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Our platform combines smart learning algorithms with comprehensive
              question banks to maximize your exam success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={BookOpen}
              iconColor="var(--accent-blue)"
              title="Practice Questions"
              description="Expertly written questions across all exam modules"
            />

            <FeatureCard
              icon={BarChart3}
              iconColor="var(--accent-green)"
              title="Progress Tracking"
              description="Monitor your performance with detailed analytics"
            />

            <FeatureCard
              icon={Medal}
              iconColor="var(--accent-gold)"
              title="Mock Exams"
              description="Realistic timed exams that simulate test conditions"
            />

            <FeatureCard
              icon={BookOpen}
              iconColor="var(--accent-purple)"
              title="Smart Learning"
              description="Learning algorithm that focuses on weak areas"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-24 bg-muted text-center">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            {SUBSCRIPTIONS_ENABLED ? (
              <>
                <h2 className="text-display mb-6">Ready to Pass Your Exams?</h2>

                <p
                  className="text-lg mb-8"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Start your free trial today, no credit card required.
                </p>

                <Button variant="primary" size="lg" leftIcon={Play}>
                  Start Free Trial
                </Button>

                <p
                  className="text-sm mt-6"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  14-day free trial • Cancel anytime • No credit card required
                </p>
              </>
            ) : isLoggedIn ? (
              <>
                <h2 className="text-display mb-6">You&apos;re on the Waitlist</h2>

                <p
                  className="text-lg mb-8"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Thanks for signing up early. GetChartered launches in July
                  2026 — manage your account or get in touch with the team any
                  time.
                </p>

                <Link href="/my-account" style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="lg" leftIcon={User}>
                    Go to My Account
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-display mb-6">Be First in Line for Launch</h2>

                <p
                  className="text-lg mb-8"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  GetChartered launches in July 2026. Sign up now to join the
                  waitlist, get early access during our free beta, and help
                  shape the product before it goes live.
                </p>

                <Link
                  href="/auth/login?screen_hint=signup"
                  style={{ textDecoration: "none" }}
                >
                  <Button variant="primary" size="lg" leftIcon={UserPlus}>
                    Join the Waitlist
                  </Button>
                </Link>

                <p
                  className="text-sm mt-6"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Free during beta • Cancel anytime
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Simple feature card component
function FeatureCard({
  icon: Icon,
  iconColor,
  title,
  description,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-hover text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: iconColor + "20" }}
      >
        <Icon size={32} style={{ color: iconColor }} />
      </div>

      <h3 className="text-kpi-title mb-2">{title}</h3>

      <p style={{ color: "var(--color-text-secondary)" }}>{description}</p>
    </div>
  );
}
