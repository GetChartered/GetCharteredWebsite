"use client";

// Soft blurred brand-colour shape with a slow, gentle vertical drift — used
// behind hero/story content for depth instead of flat section backgrounds.
// Sibling to ScrollReveal: same framer-motion base, same
// prefers-reduced-motion respect.

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

export function AmbientBlob({
  style,
  driftY = 20,
  duration = 9,
  delay = 0,
}: {
  style: CSSProperties;
  driftY?: number;
  duration?: number;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="ambient-blob"
      style={style}
      animate={shouldReduceMotion ? undefined : { y: [0, -driftY, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}
