"use client";

// 3D iPhone beside the hero headline: public/iphone.glb with the app's
// Practice screen (public/screen-practice.png) mapped onto the glTF's
// "screenMaterial". Rendered with Google's <model-viewer> web component.
//
// - Desktop only (>= 900px, same breakpoint as .hero-graphic in globals.css):
//   below that nothing is rendered AND the ~2 MB model + the viewer library
//   are never downloaded.
// - Gentle left/right sway unless the visitor prefers reduced motion; the
//   sway stops for good as soon as they grab the phone. Dragging rotates it
//   within a limited arc (front face always stays roughly toward the viewer).
// - Decorative, so it's hidden from assistive tech.

import { createElement, useEffect, useRef, useState } from "react";

const MODEL_SRC = "/iphone.glb";
const SCREEN_SRC = "/screen-practice.png";
const DESKTOP_QUERY = "(min-width: 900px)";

// The glTF's front face points down -Z, i.e. azimuth 180deg; sway around that.
const CENTRE_DEG = 160;
const SWAY_DEG = 12;
const POLAR_DEG = 82;

type ModelViewerEl = HTMLElement & {
  model?: {
    materials: Array<{
      name: string;
      setEmissiveFactor: (rgb: [number, number, number]) => void;
      emissiveTexture: { setTexture: (t: unknown) => void };
      pbrMetallicRoughness: {
        baseColorTexture: { setTexture: (t: unknown) => void };
        setMetallicFactor: (v: number) => void;
        setBaseColorFactor: (rgba: [number, number, number, number]) => void;
        setRoughnessFactor: (v: number) => void;
      };
    }>;
  };
  createTexture: (uri: string) => Promise<unknown>;
  cameraOrbit: string;
};

export function HeroPhone() {
  const ref = useRef<ModelViewerEl | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  // Only load on desktop-width screens.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let raf = 0;
    let userInteracted = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      await import("@google/model-viewer");
      if (cancelled) return;
      const el = ref.current;
      if (!el) return;

      const onLoad = async () => {
        try {
          const screen = el.model?.materials.find((m) => m.name === "screenMaterial");
          if (screen) {
            const tex = await el.createTexture(SCREEN_SRC);
            screen.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
            // No emissive glow: it washed the UI out. Slightly dim the lit base colour instead.
            screen.setEmissiveFactor([0, 0, 0]);
            screen.pbrMetallicRoughness.setBaseColorFactor([0.8, 0.8, 0.8, 1]);
            screen.pbrMetallicRoughness.setMetallicFactor(0);
            screen.pbrMetallicRoughness.setRoughnessFactor(1);
          }
        } catch (err) {
          console.error("[HeroPhone] couldn't apply screen texture", err);
        }
        if (!cancelled) setReady(true);

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) return;
        const start = performance.now();
        const tick = (now: number) => {
          if (userInteracted || cancelled) return;
          const t = (now - start) / 1000;
          const theta = CENTRE_DEG + Math.sin((t * 2 * Math.PI) / 9) * SWAY_DEG;
          el.cameraOrbit = `${theta}deg ${POLAR_DEG}deg auto`;
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      };

      const onPointerDown = () => {
        userInteracted = true;
        cancelAnimationFrame(raf);
      };

      el.addEventListener("load", onLoad);
      el.addEventListener("pointerdown", onPointerDown);
      cleanup = () => {
        el.removeEventListener("load", onLoad);
        el.removeEventListener("pointerdown", onPointerDown);
      };
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="hero-graphic"
      aria-hidden
      style={{
        position: "absolute",
        top: "50%",
        right: -20,
        transform: "translateY(-50%)",
        width: "min(400px, 36vw)",
        height: "min(640px, 58vw)",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      {createElement("model-viewer", {
        ref,
        src: MODEL_SRC,
        alt: "",
        "camera-controls": true,
        "disable-zoom": true,
        "disable-pan": true,
        "interaction-prompt": "none",
        "camera-orbit": `${CENTRE_DEG}deg ${POLAR_DEG}deg auto`,
        "min-camera-orbit": `${CENTRE_DEG - 35}deg ${POLAR_DEG - 12}deg auto`,
        "max-camera-orbit": `${CENTRE_DEG + 35}deg ${POLAR_DEG + 8}deg auto`,
        "field-of-view": "25deg",
        "shadow-intensity": "0.6",
        "shadow-softness": "1",
        exposure: "1.1",
        style: {
          width: "100%",
          height: "100%",
          background: "transparent",
          // Let the page scroll when swiping vertically over the phone.
          touchAction: "pan-y",
          outline: "none",
          "--poster-color": "transparent",
        } as React.CSSProperties,
      })}
    </div>
  );
}
