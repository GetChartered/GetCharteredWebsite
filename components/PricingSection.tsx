import { PricingCard } from "@/components/PricingCard";

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

export async function PricingSection() {
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
