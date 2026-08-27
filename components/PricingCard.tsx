"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui";

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel?: string;
  ctaHref?: string;
  highlighted?: boolean;
  badge?: string;
}

export function PricingCard({
  title,
  description,
  price,
  period,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
  badge,
}: PricingCardProps) {
  return (
    <div
      className="card relative pricing-card"
      style={{
        borderColor: highlighted
          ? "var(--color-tint)"
          : "var(--color-border-subtle)",
        borderWidth: highlighted ? "2px" : "1px",
      }}
    >
      {/* Badge */}
      {badge && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: "var(--color-tint)",
            color: "white",
            paddingLeft: "20px",
            paddingRight: "20px",
            paddingTop: "8px",
            paddingBottom: "8px",
            top: "-48px",
            boxShadow: "0 4px 10px rgba(0, 157, 158, 0.28)",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {badge}
        </div>
      )}

      <div className="p-8 pricing-card-content">
        {/* Header — title and price share a row (so the price is always a
            quick glance to the top-right); the description runs full-width
            underneath rather than being squeezed into a narrow left column
            next to the price, which was reading as cramped on the shorter
            tiers. */}
        <div className="pricing-card-header">
          <h3 className="text-kpi-title" style={{ fontSize: 22 }}>{title}</h3>
          <div className="pricing-card-price">
            <span className="text-kpi-value" style={{ fontSize: 32 }}>{price}</span>
            <span
              className="text-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {period}
            </span>
          </div>
        </div>
        <p
          className="pricing-card-description"
          style={{
            color: "var(--color-text-secondary)",
            fontSize: 15,
            lineHeight: 1.55,
            fontStyle: "italic",
          }}
        >
          {description}
        </p>

        {/* CTA Button — only Free has its own (it's the one tier that's
            actually actionable right now); the paid tiers share a single
            CTA below the whole grid instead of repeating "Join the
            Waitlist" on every card. */}
        {ctaHref && ctaLabel && (
          <div className="pricing-card-button">
            <a href={ctaHref} style={{ textDecoration: "none" }}>
              <Button
                variant={highlighted ? "primary" : "outline"}
                size="md"
                fullWidth
              >
                {ctaLabel}
              </Button>
            </a>
          </div>
        )}

        {/* Features List */}
        <ul className="pricing-card-features space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check
                size={20}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "var(--color-tint)" }}
              />
              <span style={{ color: "var(--color-text-secondary)", fontSize: 15.5 }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
