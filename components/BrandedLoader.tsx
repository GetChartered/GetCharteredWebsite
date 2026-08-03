"use client";

import { useTheme } from "@/components/ThemeProvider";

type BrandedLoaderProps = {
  /** Optional caption shown below the spinner. */
  message?: string;
  /** Diameter of the logo + ring, in px. */
  size?: number;
};

// Matches GetChartered_app's loading state (components/BrandedLoader.tsx there):
// the GC logo sits still while a ring around it spins, rather than a plain
// icon spinner. Reuses this site's own logo asset (the same one Navigation.tsx
// renders in the header) rather than the app's separate GCLogoFinal.png mark —
// the ask was to match the app's loading *behavior*, not import a new asset.
export function BrandedLoader({ message, size = 72 }: BrandedLoaderProps) {
  const { theme } = useTheme();
  const ringWidth = Math.max(3, Math.round(size / 22));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        {/* Static track — the full ring, at low opacity. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${ringWidth}px solid color-mix(in srgb, var(--color-tint) 15%, transparent)`,
          }}
        />
        {/* Spinning arc — only the top border is colored, same technique as
            the app's version, driven by Tailwind's existing animate-spin
            utility (already used for every other spinner in this codebase). */}
        <div
          className="animate-spin"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${ringWidth}px solid transparent`,
            borderTopColor: "var(--color-tint)",
          }}
        />
        <img
          src={theme === "dark" ? "/logo_dark.png" : "/logo_light.png"}
          alt="GetChartered"
          suppressHydrationWarning
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: size * 0.61,
            height: size * 0.61,
            objectFit: "contain",
          }}
        />
      </div>
      {message && <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>{message}</p>}
    </div>
  );
}
