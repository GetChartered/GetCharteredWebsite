import { Play, BookOpen, BarChart3, Medal, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/PricingSection";
import { ViewPricingButton } from "@/components/ViewPricingButton";

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

              <ViewPricingButton />
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
      <PricingSection />

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
