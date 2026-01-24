"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui";

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
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
          className="absolute left-1/2 -translate-x-1/2 rounded-full text-base font-semibold"
          style={{
            backgroundColor: "var(--color-tint)",
            color: "white",
            paddingLeft: "24px",
            paddingRight: "24px",
            paddingTop: "12px",
            paddingBottom: "12px",
            top: "-24px",
          }}
        >
          {badge}
        </div>
      )}

      <div className="p-6 pricing-card-content">
        {/* Header Section - Desktop: left/right layout, Mobile: stacked */}
        <div className="pricing-card-header">
          <div className="pricing-card-info">
            <h3 className="text-kpi-title mb-2">{title}</h3>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {description}
            </p>
          </div>

          <div className="pricing-card-price">
            <span className="text-kpi-value">{price}</span>
            <span
              className="text-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {period}
            </span>
          </div>
        </div>

        {/* CTA Button */}
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

        {/* Features List */}
        <ul className="pricing-card-features space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check
                size={20}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "var(--color-tint)" }}
              />
              <span style={{ color: "var(--color-text-secondary)" }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
