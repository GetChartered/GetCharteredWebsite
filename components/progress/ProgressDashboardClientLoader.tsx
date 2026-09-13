"use client";

// Same reason as components/HomeDecor.tsx: Next.js 16 disallows
// dynamic(..., { ssr: false }) inside a Server Component module, and
// app/progress/page.tsx is an async Server Component (requireOnboardedSession()
// runs server-side). This tiny Client Component wrapper holds the
// dynamic()/ssr:false call so the server page can import it directly.
import dynamic from "next/dynamic";

export const ProgressDashboardClient = dynamic(
  () =>
    import("@/components/progress/ProgressDashboardClient").then(
      (m) => m.ProgressDashboardClient
    ),
  { ssr: false }
);
