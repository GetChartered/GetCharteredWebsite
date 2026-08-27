"use client";

import { Check } from "lucide-react";
import { getExamVisual } from "@/lib/practice/examVisuals";

/**
 * Top-of-page multi-select scope filter for the Progress dashboard.
 * Options come from the user's configured My Exams list (GET /exam-prep),
 * not the full course syllabus (GET /courses) — this is deliberately a
 * narrower, "which of the exams I'm actually preparing for" scope, distinct
 * from Accuracy by module's single-select tabs (which pick within whatever
 * this filter leaves available — see ProgressDashboardClient's
 * relevantExams). One toggleable chip per exam code the user has
 * registered, labeled by exam name (resolved from GET /courses) when
 * known, falling back to the raw code.
 *
 * Chips, not plain checkbox+text rows — reuses the same icon+tint-per-exam
 * visual language the Coverage list's exam cards already establish
 * (lib/practice/examVisuals.ts: each exam code has its own lucide icon and
 * brand-accent tint), so an exam reads as the same visual "thing" whether
 * you're picking it here or looking at its coverage further down the page.
 * Selected = filled icon badge + tint border/text; unselected = muted gray,
 * same shape. `aria-pressed` carries the on/off semantics now that these
 * are buttons rather than native checkboxes (kept toggle-only — this was
 * never a form, so there's no submission semantics to preserve either way).
 *
 * Renders nothing when the user hasn't configured any exams yet — an empty
 * chip row with only "Select all/Deselect all" controls and nothing to
 * select would be confusing, and ProgressDashboardClient already treats "no
 * My Exams configured" as "filter inactive" (whole page unfiltered), so
 * there's nothing for this control to do in that state anyway.
 */
export function ExamScopeFilter({
  examCodes,
  examNameByCode,
  selected,
  onChange,
}: {
  /** Deduplicated exam codes from the user's My Exams list. */
  examCodes: string[];
  examNameByCode: Record<string, string>;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  if (examCodes.length === 0) return null;

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(next);
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 className="text-title" style={{ color: "var(--color-text)" }}>
          My Exams
        </h2>
        <div style={{ display: "flex", gap: 14 }}>
          <button
            type="button"
            onClick={() => onChange(new Set(examCodes))}
            style={{ border: "none", background: "transparent", color: "var(--color-tint)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            style={{ border: "none", background: "transparent", color: "var(--color-tint)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            Deselect all
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 12px" }}>
        Scope the dashboard below to specific exams you&apos;re preparing for.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {examCodes.map((code) => {
          const isSelected = selected.has(code);
          const visual = getExamVisual(code);
          const Icon = visual.icon;
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              aria-pressed={isSelected}
              className="exam-chip"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px 5px 5px",
                borderRadius: "var(--radius-full)",
                border: `2px solid ${isSelected ? "var(--color-tint)" : "var(--color-border-subtle)"}`,
                backgroundColor: isSelected
                  ? "color-mix(in srgb, var(--color-tint) 10%, var(--color-card))"
                  : "var(--color-card)",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelected ? "color-mix(in srgb, var(--color-tint) 20%, transparent)" : "var(--color-border-subtle)",
                }}
              >
                <Icon size={12} style={{ color: isSelected ? "var(--color-tint)" : "var(--color-text-muted)" }} />
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isSelected ? "var(--color-tint)" : "var(--color-text-secondary)",
                }}
              >
                {examNameByCode[code] || code}
              </span>
              {isSelected && <Check size={14} style={{ color: "var(--color-tint)", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
