"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface PracticeToolModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Narrower width for the calculator; wider default for tax tables/preferences. */
  maxWidth?: number;
  /** Lets the user drag the panel by its header (calculator only — tax
   *  tables/preferences stay simple centered modals). */
  draggable?: boolean;
  /** localStorage key the dragged position is persisted under. Required
   *  when draggable is true; reopening the modal restores this position
   *  instead of resetting to centered. */
  positionStorageKey?: string;
}

interface Position {
  x: number;
  y: number;
}

function readSavedPosition(storageKey: string): Position | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Position>;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed as Position;
  } catch {
    // ignore malformed storage
  }
  return null;
}

// Shared modal shell for the in-session tool panels (calculator, tax
// tables, preferences) — same overlay/ESC/scroll-lock behavior as
// components/LegalModal.tsx, just lighter-weight (no footer). Optionally
// draggable-by-header with a persisted position (see CalculatorModal).
export function PracticeToolModal({
  title,
  onClose,
  children,
  maxWidth = 420,
  draggable = false,
  positionStorageKey,
}: PracticeToolModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  // null = not yet dragged this open — render centered via the overlay's
  // flex layout, same as every other tool modal. Once set (either restored
  // from storage on mount, or the moment a drag starts), the panel switches
  // to fixed left/top positioning instead.
  const [position, setPosition] = useState<Position | null>(() =>
    draggable && positionStorageKey ? readSavedPosition(positionStorageKey) : null
  );
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable) return;
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const originX = position?.x ?? rect.left;
    const originY = position?.y ?? rect.top;

    dragRef.current = { startX: e.clientX, startY: e.clientY, originX, originY };
    // Lock in explicit coordinates immediately (even before any movement) so
    // the panel doesn't jump from "centered" to "absolute" later.
    setPosition({ x: originX, y: originY });
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { startX, startY, originX, originY } = dragRef.current;
    const nextX = originX + (e.clientX - startX);
    const nextY = originY + (e.clientY - startY);
    // Loose clamp so the header handle can never be dragged fully off-screen.
    const clampedX = Math.min(Math.max(nextX, -maxWidth + 80), window.innerWidth - 80);
    const clampedY = Math.min(Math.max(nextY, 0), window.innerHeight - 48);
    setPosition({ x: clampedX, y: clampedY });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (draggable && positionStorageKey && position) {
      window.localStorage.setItem(positionStorageKey, JSON.stringify(position));
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const positioned = draggable && position !== null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: positioned ? "flex-start" : "center",
        justifyContent: positioned ? "flex-start" : "center",
        padding: 16,
        zIndex: 200,
      }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-card)",
          borderRadius: "var(--radius-xl)",
          maxWidth,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
          ...(positioned
            ? { position: "fixed", left: position.x, top: position.y, margin: 0 }
            : {}),
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
            cursor: draggable ? (isDragging ? "grabbing" : "grab") : undefined,
            touchAction: draggable ? "none" : undefined,
            userSelect: draggable ? "none" : undefined,
          }}
        >
          <h2 style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 16, margin: 0 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "var(--color-text-muted)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
