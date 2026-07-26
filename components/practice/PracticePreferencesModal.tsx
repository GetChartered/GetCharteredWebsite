"use client";

import { type LucideIcon, BookOpen, Shuffle, Zap } from "lucide-react";
import { PracticeToolModal } from "@/components/practice/PracticeToolModal";
import type { usePracticePreferences } from "@/hooks/usePracticePreferences";

type Preferences = ReturnType<typeof usePracticePreferences>;

// Ported from GetChartered_app's components/ui/PracticePreferences.tsx — same
// three toggles, same copy.
export function PracticePreferencesModal({
  prefs,
  onClose,
}: {
  prefs: Preferences;
  onClose: () => void;
}) {
  const rows: { icon: LucideIcon; title: string; description: string; value: boolean; onToggle: () => void }[] = [
    {
      icon: Shuffle,
      title: "Shuffle answers",
      description: "Stops you learning answers by position",
      value: prefs.shuffleOrder,
      onToggle: prefs.toggleShuffleOrder,
    },
    {
      icon: BookOpen,
      title: "Show explanations",
      description: "Reveals why each answer is correct",
      value: prefs.showExplanations,
      onToggle: prefs.toggleShowExplanations,
    },
    {
      icon: Zap,
      title: "Answer feedback",
      description: "Highlights the correct answer after you submit",
      value: prefs.showCorrectFlash,
      onToggle: prefs.toggleShowCorrectFlash,
    },
  ];

  return (
    <PracticeToolModal title="Practice Preferences" onClose={onClose} maxWidth={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row) => (
          <button
            key={row.title}
            type="button"
            onClick={row.onToggle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-subtle)",
              backgroundColor: "var(--color-card)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-card-alt)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <row.icon size={17} style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{row.title}</p>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                {row.description}
              </p>
            </div>
            <span
              style={{
                width: 40,
                height: 24,
                borderRadius: 999,
                backgroundColor: row.value ? "var(--color-tint)" : "var(--color-border-subtle)",
                position: "relative",
                flexShrink: 0,
                transition: "background-color 0.15s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: row.value ? 19 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  transition: "left 0.15s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </span>
          </button>
        ))}
      </div>
    </PracticeToolModal>
  );
}
