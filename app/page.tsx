"use client";

import { Play, BookOpen, BarChart3, Medal } from "lucide-react";
import { Button } from "@/components/ui";
import { PricingCard } from "@/components/PricingCard";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Home() {
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
              Practice questions for your ACA, CFA, CISI exams with our
              intelligent learning platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" leftIcon={Play}>
                Start Free Trial
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  document.getElementById("pricing")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
              >
                View Pricing
              </Button>
            </div>
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
              description="AI-powered algorithm focuses on weak areas"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-display mb-4">Simple, Transparent Pricing</h2>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Choose the plan that&apos;s right for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" style={{ gap: '48px' }}>
            <PricingCard
              title="Free"
              description="Perfect for getting started"
              price="£0"
              period="/forever"
              features={[
                "100 practice questions",
                "Basic progress tracking",
                "1 module access",
                "Community support",
              ]}
              ctaLabel="Get Started Free"
              ctaHref="/purchase"
            />

            <PricingCard
              title="Premium"
              description="Most popular for serious students"
              price="£14.99"
              period="/month"
              features={[
                "Unlimited practice questions",
                "All modules included",
                "Advanced analytics",
                "Mock exams & timed practice",
                "Offline access",
                "Priority support",
              ]}
              ctaLabel="Start Free Trial"
              ctaHref="/purchase"
              highlighted={true}
              badge="Recommended for Professionals"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted text-center">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-display mb-6">Ready to Pass Your Exams?</h2>

            <p
              className="text-lg mb-8"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Start your free trial today—no credit card required.
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
  icon: any;
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
