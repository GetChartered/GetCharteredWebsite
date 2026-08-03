"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useTour } from "@/lib/tour/TourProvider";
import { getTourAnchorElement } from "@/lib/tour/TourAnchor";
import { TOUR_STEPS, type TourStep, type TourStepPlacement } from "@/lib/tour/tourConfig";

// Mirrors GetChartered_app's measureAnchor timeout/poll shape (AnchorRegistry.ts):
// keep trying for a few seconds, then give up gracefully rather than hang.
const ANCHOR_TIMEOUT_MS = 3000;
const ANCHOR_POLL_INTERVAL_MS = 100;
// Above Navigation's sticky nav (zIndex 50) and its mobile-menu backdrop (40).
const OVERLAY_Z_INDEX = 1000;
const DIM_COLOR = "rgba(0, 0, 0, 0.5)"; // matches Navigation.tsx's mobile-menu backdrop

type Rect = { top: number; left: number; width: number; height: number };
// Tagged with the step it was measured for, so a stale measurement from the
// previous step can be *derived* away (ignored if stepId doesn't match
// currentStep.id) during render instead of needing an explicit "reset to
// null" setState call when the step changes — the resolution effect below
// only ever needs to set this, never clear it.
type Measurement = { stepId: string; rect: Rect };

function rectFromElement(element: HTMLElement): Rect {
  const domRect = element.getBoundingClientRect();
  return { top: domRect.top, left: domRect.left, width: domRect.width, height: domRect.height };
}

// Same "has hydration committed" idiom as components/ThemeProvider.tsx's
// useSyncExternalStore usage — nothing external ever changes this (the
// subscribe is a no-op), it's purely a way to get "false on the server /
// first client render, true after" without a setState-in-effect round trip.
const subscribeNever = () => () => {};
function useHasMounted(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

// The one always-mounted piece (see app/layout.tsx) — renders nothing until
// the provider says a tour is in_progress. Owns all the DOM-dependent work
// (measuring, navigating, polling) that TourProvider deliberately doesn't:
// TourProvider is pure state, this is the "engine" that reacts to it.
export function TourOverlay() {
  const { status, currentStep, stepIndex, next, skip } = useTour();
  const pathname = usePathname();
  const router = useRouter();
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  // createPortal needs document.body, which isn't safe to touch before the
  // first client render has committed.
  const mounted = useHasMounted();

  // A measurement only counts if it was taken for the step currently being
  // shown — anything left over from the previous step is ignored here
  // rather than explicitly cleared, so the resolution effect below never
  // needs a "reset to null" setState call when the step changes.
  const targetRect =
    measurement && currentStep && measurement.stepId === currentStep.id ? measurement.rect : null;

  // Resolves the current step: navigate to its route if we're not there yet,
  // then (for anchored steps) poll for the anchor to exist before measuring.
  // Degrades by calling next() — skipping past this one step, not the whole
  // tour — if the anchor never shows up within the timeout, e.g. Phase 2
  // content referencing an anchorId nothing has registered yet, or a
  // destination page whose data never finished loading.
  useEffect(() => {
    if (!currentStep) return;

    if (currentStep.route && currentStep.route !== pathname) {
      router.push(currentStep.route);
      return; // re-runs once usePathname() reflects the new route
    }

    if (!currentStep.anchorId) return; // centered card — nothing to measure

    let cancelled = false;
    // Typed explicitly as `number` (window.setTimeout's actual DOM return
    // type) rather than derived via ReturnType<typeof window.setTimeout> —
    // @types/node's ambient global setTimeout/Timeout declarations otherwise
    // make that derived type ambiguous in this project (no "types" array
    // restriction in tsconfig.json to exclude node's globals).
    let timeoutId: number;
    const startedAt = Date.now();
    const stepId = currentStep.id;
    const anchorId = currentStep.anchorId;

    const tick = () => {
      if (cancelled) return;
      const element = getTourAnchorElement(anchorId);
      if (element) {
        setMeasurement({ stepId, rect: rectFromElement(element) });
        return;
      }
      if (Date.now() - startedAt > ANCHOR_TIMEOUT_MS) {
        next();
        return;
      }
      timeoutId = window.setTimeout(tick, ANCHOR_POLL_INTERVAL_MS);
    };
    tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentStep, pathname, router, next]);

  // While a spotlighted step is showing, keep the cutout tracking its target
  // through scrolling/resizing instead of drifting out of place.
  useEffect(() => {
    if (!currentStep?.anchorId) return;
    const stepId = currentStep.id;
    const anchorId = currentStep.anchorId;
    const remeasure = () => {
      const element = getTourAnchorElement(anchorId);
      if (element) setMeasurement({ stepId, rect: rectFromElement(element) });
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [currentStep]);

  if (!mounted || status !== "in_progress" || !currentStep) return null;

  // Still navigating to the step's route or waiting for its anchor to
  // appear — render nothing rather than a spotlight in the wrong place.
  if (currentStep.anchorId && !targetRect) return null;

  const isLastStep = stepIndex >= TOUR_STEPS.length - 1;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: OVERLAY_Z_INDEX }}>
      {targetRect ? <SpotlightCutout rect={targetRect} /> : <FullDim />}
      <TourCard step={currentStep} rect={targetRect} isLastStep={isLastStep} onNext={next} onSkip={skip} />
    </div>,
    document.body
  );
}

function FullDim() {
  return <div style={{ position: "fixed", inset: 0, backgroundColor: DIM_COLOR }} />;
}

// Four dim panels boxing in a cutout around `rect`, plus a highlight border —
// conceptually the same technique as GetChartered_app's Spotlight.tsx (four
// panels around the target, not an SVG mask/clip-path), translated to
// measured pixel positions instead of React Native layout.
function SpotlightCutout({ rect }: { rect: Rect }) {
  const PAD = 6;
  const top = Math.max(0, rect.top - PAD);
  const left = Math.max(0, rect.left - PAD);
  const width = rect.width + PAD * 2;
  const height = rect.height + PAD * 2;

  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: top, backgroundColor: DIM_COLOR }} />
      <div
        style={{ position: "fixed", top: top + height, left: 0, right: 0, bottom: 0, backgroundColor: DIM_COLOR }}
      />
      <div style={{ position: "fixed", top, left: 0, width: left, height, backgroundColor: DIM_COLOR }} />
      <div style={{ position: "fixed", top, left: left + width, right: 0, height, backgroundColor: DIM_COLOR }} />
      <div
        style={{
          position: "fixed",
          top,
          left,
          width,
          height,
          borderRadius: "var(--radius-md)",
          border: "2px solid var(--color-tint)",
          boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-tint) 25%, transparent)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

const CENTERED_CARD_STYLE: CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
};

// null `rect` means a centered step regardless of its declared placement —
// only reachable here after mount (TourOverlay returns null pre-mount), so
// `window` is always safe to read in the top/left/right branches.
function positionedCardStyle(rect: Rect | null, placement: TourStepPlacement): CSSProperties {
  if (!rect) return CENTERED_CARD_STYLE;

  const GAP = 12;
  switch (placement) {
    case "top":
      return { position: "fixed", left: rect.left, bottom: window.innerHeight - rect.top + GAP };
    case "bottom":
      return { position: "fixed", left: rect.left, top: rect.top + rect.height + GAP };
    case "left":
      return { position: "fixed", top: rect.top, right: window.innerWidth - rect.left + GAP };
    case "right":
      return { position: "fixed", top: rect.top, left: rect.left + rect.width + GAP };
    case "center":
    default:
      return CENTERED_CARD_STYLE;
  }
}

function TourCard({
  step,
  rect,
  isLastStep,
  onNext,
  onSkip,
}: {
  step: TourStep;
  rect: Rect | null;
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const cardStyle = positionedCardStyle(rect, step.placement);

  return (
    <div
      className="card"
      style={{ ...cardStyle, width: 320, maxWidth: "calc(100vw - 32px)", padding: 20 }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
        {step.title}
      </h3>
      <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 16 }}>{step.body}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip tour
        </Button>
        <Button variant="primary" size="sm" onClick={onNext}>
          {isLastStep ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
