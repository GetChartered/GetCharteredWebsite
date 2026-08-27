import { PricingCard } from "@/components/PricingCard";
import { Button } from "@/components/ui";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AmbientBlob } from "@/components/AmbientBlob";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";

interface PricingData {
  id: string;
  productName: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  features: string[];
  metadata: Record<string, string>;
}

async function getPricing(): Promise<PricingData[]> {
  try {
    const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/pricing`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch pricing:', res.statusText);
      return [];
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return [];
  }
}

function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return '£0';

  // Format based on currency
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

  // Remove decimals if it's a whole number
  const formattedAmount = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);

  return `${symbol}${formattedAmount}`;
}

function formatPeriod(interval: string, intervalCount: number): string {
  if (interval === 'one_time') return '/forever';

  const periodMap: Record<string, string> = {
    day: 'day',
    week: 'week',
    month: 'month',
    year: 'year',
  };

  const period = periodMap[interval] || interval;

  if (intervalCount === 1) {
    return `/${period}`;
  }

  return `/${intervalCount} ${period}s`;
}

// Pre-launch pricing, shown while Stripe/checkout isn't wired up yet
// (SUBSCRIPTIONS_ENABLED off). Confirmed with Pierce: Free / £15 per month /
// £100 per year / £25 per exam. Feature bullets below are draft copy only —
// Hugo/Pierce to refine wording before this ships; the prices and billing
// periods are the confirmed part.
// No per-card CTAs — every card is header + description + features only,
// so all four line up symmetrically. One shared CTA sits below the whole
// grid instead (real action right now is account signup; it's the same
// flow whichever tier someone actually wants).
const PRELAUNCH_TIERS = [
  {
    title: "Free",
    description: "Get a feel for GetChartered before you commit.",
    price: "£0",
    period: "/forever",
    features: [
      "A sample of practice questions per module",
      "Basic progress tracking",
      "Study planner & calendar",
    ],
    highlighted: false,
  },
  {
    title: "Monthly",
    description: "Full access, cancel anytime.",
    price: "£15",
    period: "/month",
    features: [
      "Unlimited practice across all your modules",
      "Full progress analytics & coverage tracking",
      "Study planner & calendar",
      "Mock exams",
    ],
    highlighted: false,
  },
  {
    title: "Annual",
    description: "Everything in Monthly — best value across a full study year.",
    price: "£100",
    period: "/year",
    features: [
      "Save vs. paying monthly across the year",
      "Priority support",
      "First access to new question banks",
      "One renewal, no monthly admin",
    ],
    highlighted: true,
    badge: "Best Value",
  },
  {
    title: "Per Exam",
    description: "Full access scoped to a single upcoming exam sitting.",
    price: "£25",
    period: "/exam",
    features: [
      "Unlimited practice for one exam",
      "Full progress analytics for that exam",
      "Study planner & calendar",
    ],
    highlighted: false,
  },
];

function PrelaunchPricing() {
  return (
    <section
      id="pricing"
      className="home-pricing-section"
      style={{ position: "relative", overflow: "hidden", zIndex: 1 }}
    >
      <AmbientBlob
        style={{
          width: 420,
          height: 420,
          top: -60,
          left: "-12%",
          background:
            "radial-gradient(circle, #0F9BAF 0%, rgba(15,155,175,0) 70%)",
        }}
        duration={12}
        delay={0.4}
      />
      <div className="container-pricing" style={{ position: "relative" }}>
        <ScrollReveal>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", marginBottom: 40 }}>
            <span className="text-eyebrow mb-3" style={{ display: "block" }}>
              Pricing
            </span>
            <h2 className="text-display mb-4" style={{ color: "var(--color-text)" }}>
              Simple, transparent pricing
            </h2>
            <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
              Start free, then choose whatever fits how you study — monthly,
              annually, or scoped to a single exam.
            </p>
          </div>
        </ScrollReveal>

        <div className="pricing-tier-grid">
          {PRELAUNCH_TIERS.map((tier, i) => (
            <ScrollReveal key={tier.title} delay={0.1 + i * 0.08} y={18}>
              <PricingCard
                title={tier.title}
                description={tier.description}
                price={tier.price}
                period={tier.period}
                features={tier.features}
                highlighted={tier.highlighted}
                badge={tier.badge}
              />
            </ScrollReveal>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <a href="/auth/login?screen_hint=signup" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="lg">
              Get Started Free
            </Button>
          </a>
          <p
            className="text-sm"
            style={{ marginTop: 16, color: "var(--color-text-muted)" }}
          >
            Sign up free today — we&apos;ll email you the moment paid plans
            are ready to go live.
          </p>
        </div>
      </div>
    </section>
  );
}

export async function PricingSection() {
  if (!SUBSCRIPTIONS_ENABLED) {
    return <PrelaunchPricing />;
  }

  const pricingData = await getPricing();

  // Filter to only show paid plans (exclude free plans)
  const paidPlans = pricingData.filter(plan => plan.amount > 0);

  // Fallback to hardcoded pricing if API fails or no paid plans
  if (paidPlans.length === 0) {
    return (
      <section id="pricing" className="py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-display mb-4">Simple, Transparent Pricing</h2>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Get access to all features with our premium plan
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <PricingCard
              title="Premium"
              description="Everything you need to pass your exams"
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
            />
          </div>
        </div>
      </section>
    );
  }

  // Get the first paid plan (in case there are multiple like test products)
  const plan = paidPlans[0];

  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-display mb-4">Simple, Transparent Pricing</h2>
          <p
            className="max-w-2xl mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Get access to all features with our premium plan
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <PricingCard
            title={plan.productName}
            description={plan.description || "Everything you need to pass your exams"}
            price={formatPrice(plan.amount, plan.currency)}
            period={formatPeriod(plan.interval, plan.intervalCount)}
            features={plan.features.length > 0 ? plan.features : [
              "Unlimited practice questions",
              "All modules included",
              "Advanced analytics",
              "Mock exams & timed practice",
              "Offline access",
              "Priority support",
            ]}
            ctaLabel={plan.metadata.ctaLabel || "Start Free Trial"}
            ctaHref="/purchase"
            highlighted={true}
          />
        </div>
      </div>
    </section>
  );
}
