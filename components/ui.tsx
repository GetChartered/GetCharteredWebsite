// Core UI components matching the app

import React, { forwardRef } from "react";
import { Loader2, type LucideIcon } from "lucide-react";

// ============================================
// BUTTON
// ============================================

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const classes = [
      "btn",
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth && "btn-full",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading ? (
          <Loader2
            className="animate-spin"
            size={size === "sm" ? 16 : size === "md" ? 18 : 20}
          />
        ) : (
          <>
            {LeftIcon && (
              <LeftIcon size={size === "sm" ? 16 : size === "md" ? 18 : 20} />
            )}
            {children}
            {RightIcon && (
              <RightIcon size={size === "sm" ? 16 : size === "md" ? 18 : 20} />
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

// ============================================
// INPUT
// ============================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: LucideIcon;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      leftIcon: LeftIcon,
      containerClassName = "",
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block font-semibold text-sm mb-2">{label}</label>
        )}

        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              <LeftIcon size={18} />
            </div>
          )}

          <input
            ref={ref}
            className={`input ${LeftIcon ? "pl-10" : ""} ${errorText ? "input-error" : ""} ${className}`}
            {...props}
          />
        </div>

        {(errorText || helperText) && (
          <p
            className={`text-xs mt-1 ${errorText ? "text-danger" : "text-text-secondary"}`}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// ============================================
// CARD
// ============================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`card ${hover ? "card-hover" : ""} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

// ============================================
// BADGE
// ============================================

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "success" | "info";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = "info", className = "", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`badge badge-${variant} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

// ============================================
// STAT TILE
// ============================================

export interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  color: string;
  infoTooltip?: React.ReactNode;
  size?: "md" | "lg";
}

// Icon-in-colored-circle -> big bold value -> small label (with an optional
// info-icon popover) -> optional caption below. Originated on the progress
// dashboard's overview tiles; shared here so the leaderboard's "Your
// position" panel can reuse the exact same proven visual pattern.
export function StatTile({ icon: Icon, label, value, caption, color, infoTooltip, size = "md" }: StatTileProps) {
  const isLarge = size === "lg";
  const circleSize = isLarge ? 52 : 44;
  const iconSize = isLarge ? 24 : 20;
  const valueSize = isLarge ? 34 : 28;

  return (
    <div className="card" style={{ padding: isLarge ? 24 : 20, textAlign: "center" }}>
      <div
        className="rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ width: circleSize, height: circleSize, backgroundColor: color + "20" }}
      >
        <Icon size={iconSize} style={{ color }} />
      </div>
      <p style={{ fontSize: valueSize, fontWeight: 700, color: "var(--color-text)" }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{label}</p>
        {infoTooltip}
      </div>
      {caption && (
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>{caption}</p>
      )}
    </div>
  );
}

