"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

export interface InfoTooltipProps {
  children: React.ReactNode;
  label?: string;
  size?: number;
}

// Small (?) icon that shows a popover with `children` on hover (desktop) or
// tap (touch/mobile) — closes on click-outside. Shared by any page that
// needs a plain-language explainer instead of an always-visible paragraph.
// Split out from components/ui.tsx (which stays server-importable, e.g. the
// homepage renders Button from it) since this needs client-only hooks.
export function InfoTooltip({ children, label = "More info", size = 15 }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <span
      ref={containerRef}
      style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          color: "var(--color-text-muted)",
          lineHeight: 0,
        }}
      >
        <HelpCircle size={size} />
      </button>

      {open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 20,
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            maxWidth: "min(240px, 80vw)",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
            fontSize: 12,
            lineHeight: 1.5,
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            textAlign: "left",
            whiteSpace: "normal",
          }}
        >
          {children}
        </div>
      )}
    </span>
  );
}
