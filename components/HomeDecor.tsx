"use client";

// Next.js 16 forbids `dynamic(..., { ssr: false })` from being called
// directly inside a Server Component module (app/page.tsx is an async
// Server Component -- it calls getOptionalSession() server-side). The three
// exports below are all client-only decorative components anyway (scroll
// animation, blurred blob, hero graphic), so this file exists purely to
// hold the dynamic()/ssr:false calls in a Client Component, which Next
// allows. Import ScrollReveal/AmbientBlob/HeroGraphic from here instead of
// calling next/dynamic directly in a server page.
import dynamic from "next/dynamic";

export const ScrollReveal = dynamic(
  () => import("@/components/ScrollReveal").then((m) => m.ScrollReveal),
  { ssr: false }
);

export const AmbientBlob = dynamic(
  () => import("@/components/AmbientBlob").then((m) => m.AmbientBlob),
  { ssr: false }
);

export const HeroGraphic = dynamic(
  () => import("@/components/HeroGraphic").then((m) => m.HeroGraphic),
  { ssr: false }
);
