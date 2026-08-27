"use client";

// Site-wide scroll-triggered reveal primitive, built on framer-motion (the
// site's standard animation library going forward — see /about, the first
// page to use it). No existing animation infra fit this: the Progress
// page's "smooth" transitions are just recharts' own built-in data-change
// animation (Area/Bar `isAnimationActive`), which only fires on prop
// changes, not on scroll/viewport entry, so it doesn't generalize to
// revealing arbitrary sections as they enter the viewport.

import { motion, useReducedMotion, type Transition } from "framer-motion";
import type { ReactNode } from "react";

const EASE: Transition["ease"] = [0.16, 1, 0.3, 1];

export function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.6,
  className,
  style,
}: {
  children: ReactNode;
  /** Seconds to stagger this element after its siblings. */
  delay?: number;
  /** Starting vertical offset in px — larger reads as more "slide", smaller as more "fade". */
  y?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
