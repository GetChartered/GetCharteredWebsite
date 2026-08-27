"use client";

// Abstract, decorative only — a fanned stack of practice-question cards
// with a mastery progress-ring badge, deliberately NOT a hub-and-spoke /
// orbiting-node composition (that pattern reads too close to competitor
// Acuru's hero graphic). Ties the visual directly to what the product
// actually does — adaptive question cards + progress tracking — rather
// than a generic abstract network shape. Motion is gentle vertical drift
// (no rotation, nothing under ~6s per cycle) and fully respects
// prefers-reduced-motion, same contract as ScrollReveal/AmbientBlob.

import { motion, useReducedMotion } from "framer-motion";

export function HeroGraphic() {
  const shouldReduceMotion = useReducedMotion();

  const float = (delay: number, distance = 10) =>
    shouldReduceMotion
      ? undefined
      : {
          y: [0, -distance, 0],
          transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay },
        };

  return (
    <div
      className="hero-graphic"
      aria-hidden
      style={{
        position: "absolute",
        top: "50%",
        right: 0,
        transform: "translateY(-50%)",
        width: 400,
        height: 400,
        pointerEvents: "none",
      }}
    >
      {/* Soft ambient glow behind the composition. */}
      <div
        style={{
          position: "absolute",
          inset: "10%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,157,158,0.16) 0%, rgba(0,157,158,0) 70%)",
          filter: "blur(30px)",
        }}
      />

      <svg viewBox="0 0 400 400" width="100%" height="100%" fill="none" style={{ position: "relative" }}>
        <defs>
          <linearGradient id="heroCardBack" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F9BAF" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#009D9E" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="heroCardMid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F9BAF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#009D9E" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="heroCardFront" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ADB5" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#009D9E" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="heroRingGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5B301" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F5B301" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Back card — furthest, faintest, tilted left. */}
        <motion.g
          style={{ transformOrigin: "190px 220px" }}
          animate={float(0, 8)}
        >
          <rect
            x="90" y="130" width="200" height="240" rx="24"
            fill="url(#heroCardBack)"
            stroke="#0F9BAF" strokeOpacity="0.18" strokeWidth="1.25"
            transform="rotate(-10 190 250)"
          />
        </motion.g>

        {/* Middle card — tilted right, sits above the back card. */}
        <motion.g
          style={{ transformOrigin: "210px 220px" }}
          animate={float(0.6, 10)}
        >
          <rect
            x="95" y="115" width="200" height="240" rx="24"
            fill="url(#heroCardMid)"
            stroke="#009D9E" strokeOpacity="0.28" strokeWidth="1.25"
            transform="rotate(7 195 235)"
          />
        </motion.g>

        {/* Front card — the "active question" card, upright, solid, with
            simple line-content so it reads as a practice-question card
            without needing real copy. */}
        <motion.g
          style={{ transformOrigin: "200px 230px" }}
          animate={float(1.2, 12)}
        >
          <rect
            x="88" y="108" width="212" height="252" rx="26"
            fill="url(#heroCardFront)"
            style={{ filter: "drop-shadow(0 18px 28px rgba(0,110,112,0.28))" }}
          />
          {/* question line */}
          <rect x="116" y="150" width="156" height="10" rx="5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="116" y="170" width="112" height="10" rx="5" fill="#ffffff" fillOpacity="0.55" />
          {/* answer options */}
          <rect x="116" y="216" width="156" height="34" rx="17" fill="#ffffff" fillOpacity="0.16" />
          <rect x="116" y="260" width="156" height="34" rx="17" fill="#ffffff" fillOpacity="0.28" />
          <circle cx="136" cy="277" r="9" fill="#ffffff" fillOpacity="0.9" />
          <path d="M132 277l3 3 6-6" stroke="#009D9E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="116" y="304" width="156" height="34" rx="17" fill="#ffffff" fillOpacity="0.16" />
        </motion.g>

        {/* Mastery progress-ring badge — overlaps the front card's top-right
            corner, the one "alive" focal element. Distinctly a progress
            indicator, not a network node. */}
        <motion.g animate={float(1.8, 8)}>
          <circle cx="308" cy="112" r="50" fill="url(#heroRingGlow)" />
          <circle cx="308" cy="112" r="34" fill="var(--color-bg, #F7FAFA)" stroke="#E7EFEF" strokeWidth="2" />
          <circle
            cx="308" cy="112" r="34"
            stroke="#F5B301"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="176 214"
            transform="rotate(-90 308 112)"
          />
          <circle cx="308" cy="112" r="20" fill="#ffffff" />
          <path
            d="M299 112l6 6 12-13"
            stroke="#0F9BAF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>
      </svg>
    </div>
  );
}
