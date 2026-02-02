interface SubscriptionCardProps {
  planName: string;
  planPrice: string;
  status: string;
  nextBillingDate?: Date;
  features?: string[];
  isCurrentPlan?: boolean;
}

export function SubscriptionCard({
  planName,
  planPrice,
  status,
  nextBillingDate,
  features = [],
  isCurrentPlan = false,
}: SubscriptionCardProps) {
  return (
    <div className={`p-6 rounded-lg border-2 ${
      isCurrentPlan ? 'border-color-tint bg-accent-subtle' : 'border-border-subtle'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-title font-semibold text-text-main mb-1">{planName}</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-display font-bold text-text-main">${planPrice}</span>
            <span className="text-body text-text-secondary">/month</span>
          </div>
        </div>
        {isCurrentPlan && <span className="badge badge-success capitalize">{status}</span>}
      </div>

      {features.length > 0 && (
        <ul className="space-y-2 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-body text-text-secondary">
              <span className="text-color-success">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {nextBillingDate && (
        <p className="text-caption text-text-secondary">
          Next billing: {nextBillingDate.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
