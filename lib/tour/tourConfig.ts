export type TourStepPlacement = "top" | "bottom" | "left" | "right" | "center";

export type TourStep = {
  /** Stable id — also used to look up the step's target via TourAnchor/registry. */
  id: string;
  /**
   * Id of the TourAnchor this step spotlights. null means a centered card
   * with a full-screen dim (no cutout) — used for steps like a welcome or
   * completion screen that aren't about a specific piece of UI.
   */
  anchorId: string | null;
  /**
   * Path this step's anchor lives on. null means "wherever the tour
   * currently is" (no navigation needed — typically paired with
   * anchorId: null for a centered step that can show on any page).
   * When set and different from the current page, TourOverlay navigates
   * here before trying to resolve the anchor.
   */
  route: string | null;
  title: string;
  body: string;
  placement: TourStepPlacement;
};

// PLACEHOLDER CONTENT — Phase 2 replaces this with the real step sequence:
// Welcome -> Nav overview -> Practice hub -> Progress -> Leaderboard ->
// Account/My Exams -> Completion. Phase 2 also adds the actual TourAnchor
// wrappers on real page elements that anchorId values below would need to
// reference (none exist yet, which is fine for the placeholder step below —
// its anchor simply won't resolve, which is exactly the "anchor never
// appears" path TourOverlay's polling/timeout is meant to handle gracefully).
//
// Kept at 3 steps for now (centered -> anchored+cross-page -> centered) since
// that's the minimum needed to exercise every code path in the engine: a
// centered card, a cross-page navigation, an anchor-measurement wait, and
// the timeout/degrade fallback when an anchor doesn't exist.
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    anchorId: null,
    route: null,
    title: "TODO: welcome title",
    body: "TODO: welcome body copy.",
    placement: "center",
  },
  {
    id: "placeholder-anchored-step",
    anchorId: "TODO-anchor-id",
    route: "/practice",
    title: "TODO: placeholder step title",
    body: "TODO: placeholder step body copy — replace anchorId/route once Phase 2 wraps a real element in a TourAnchor.",
    placement: "bottom",
  },
  {
    id: "completion",
    anchorId: null,
    route: null,
    title: "TODO: completion title",
    body: "TODO: completion body copy.",
    placement: "center",
  },
];
