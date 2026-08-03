"use client";

import { useEffect, useRef } from "react";

// Module-level, not React state: registration is a side effect of a page's
// own render (a page mounts a TourAnchor, which is unrelated to whatever
// state TourOverlay holds), so there's no meaningful "owner" component to
// hold this in state, and doing so would trigger re-renders no one needs —
// TourOverlay reads this map imperatively (see getTourAnchorElement) inside
// its own polling effect rather than subscribing to it. Conceptually the
// same role as GetChartered_app's AnchorRegistry (tour/AnchorRegistry.ts) —
// a global lookup keyed by a stable id so the tour engine can resolve
// "whatever page currently has an element registered under this id" without
// caring which page mounted it — but not ported: the app polls
// measureInWindow because React Native has no DOM to hold a ref against;
// here the ref IS the DOM node, so registration is synchronous and
// TourOverlay does its own getBoundingClientRect instead of a measure call.
const registry = new Map<string, HTMLElement>();

export function getTourAnchorElement(id: string): HTMLElement | null {
  return registry.get(id) ?? null;
}

type TourAnchorProps = {
  /** Stable id a TourStep's anchorId refers to. */
  id: string;
  children: React.ReactNode;
};

// Wraps any element so the tour engine can find and measure it later via
// getBoundingClientRect, without the wrapped element needing to know
// anything about the tour. Renders a plain <div> — Phase 2's real usage
// sites decide what they're wrapping and can adjust layout at the call site
// if the wrapper div itself needs to not affect flow (e.g. display: contents
// isn't used here since that would zero out getBoundingClientRect on the
// wrapper itself).
export function TourAnchor({ id, children }: TourAnchorProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    registry.set(id, element);
    return () => {
      // Only clear if this exact element is still the registered one —
      // guards against a remount race clobbering a different instance that
      // registered under the same id after this one's cleanup was queued.
      if (registry.get(id) === element) {
        registry.delete(id);
      }
    };
  }, [id]);

  return <div ref={ref}>{children}</div>;
}
