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
