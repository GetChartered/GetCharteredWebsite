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
 * Chips, not plain checkbox+text rows — still uses each exam's icon shape
 * from lib/practice/examVisuals.ts so exams stay distinguishable at a
 * glance, but deliberately does NOT use that file's per-exam tint/bg
 * colours (that produced a "rainbow" of exam-specific hues here — see
 * ProgressDashboardClient's module-coverage cards for where that per-exam
 * colour scheme is still intentionally used). This filter is a flat
 * two-state control instead: unselected = --color-tint outline/text/icon on
 * --color-card, selected = solid --color-tint fill with white text/icon,
 * matching the site's single brand teal rather than an exam-identity
 * palette. `aria-pressed` carries the on/off semantics now that these are
 * buttons rather than native checkboxes (kept toggle-only — this was never
 * a form, so there's no submission semantics to preserve either way).
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
          const Icon = getExamVisual(code).icon;
          const color = isSelected ? "#ffffff" : "var(--color-tint)";
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
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "2px solid var(--color-tint)",
                backgroundColor: isSelected ? "var(--color-tint)" : "var(--color-card)",
                cursor: "pointer",
              }}
            >
              <Icon size={14} style={{ color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color }}>
                {examNameByCode[code] || code}
              </span>
              {isSelected && <Check size={14} style={{ color, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
