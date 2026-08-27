"use client";

// Site-wide toast/notification system — context + auto-rendered viewport,
// same "Provider mounted once at the root, hook used anywhere" shape as
// lib/tour/TourProvider.tsx. First usage is MyExamsSection's Save action
// (components/account/MyExamsSection.tsx); any client component anywhere on
// the site can call useToast() without extra wiring since ToastProvider
// wraps the whole app in app/layout.tsx.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 3000;

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      toastIdCounter += 1;
      const id = toastIdCounter;
      setToasts((prev) => [...prev, { id, message, variant }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      );
    },
    [dismiss]
  );

  // Clear any pending dismiss timers on unmount (route/provider teardown) so
  // they don't fire setState against an unmounted tree.
  useEffect(() => {
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((timer) => clearTimeout(timer));
      timersMap.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 300,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const isSuccess = toast.variant === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;
  const accent = isSuccess ? "var(--color-tint)" : "var(--color-danger)";

  return (
    <div
      role="status"
      className="toast-card"
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 260,
        maxWidth: 360,
        padding: "14px 16px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border-subtle)",
        borderLeft: `3px solid ${accent}`,
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
      }}
    >
      <Icon size={18} style={{ color: accent, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)", flex: 1 }}>
        {toast.message}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          padding: 2,
          display: "flex",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
