"use client";

import { useState } from "react";
import { Check, ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui";
import type { PracticeExamGroup } from "@/lib/practice/types";

type ModuleSelectorProps = {
  exams: PracticeExamGroup[];
  selected: string[];
  onChange: (next: string[]) => void;
  onStart: () => void;
  starting: boolean;
  /** "multi" (default) lets several modules be checked; "single" replaces the selection on each click, like a radio group. */
  selectionMode?: "multi" | "single";
  title?: string;
  description?: string;
  startLabel?: string;
};

export function ModuleSelector({
  exams,
  selected,
  onChange,
  onStart,
  starting,
  selectionMode = "multi",
  title = "Choose your modules",
  description = "Quick Practice mixes questions across whichever modules you pick.",
  startLabel = "Start Quick Practice",
}: ModuleSelectorProps) {
  const isSingle = selectionMode === "single";
  // Collapsed by default, first exam open so the list doesn't look empty.
  const [openCode, setOpenCode] = useState<string | null>(exams[0]?.code ?? null);

  const allModuleCodes = exams.flatMap((exam) => exam.modules.map((m) => m.code));
  const allSelected = allModuleCodes.length > 0 && selected.length === allModuleCodes.length;

  const toggleModule = (code: string) => {
    if (isSingle) {
      onChange([code]);
      return;
    }
    onChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
    );
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : allModuleCodes);
  };

  const selectedCountFor = (exam: PracticeExamGroup) =>
    exam.modules.filter((m) => selected.includes(m.code)).length;

  return (
    <div className="card" style={{ padding: 24 }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 16 }}
      >
        <h2 className="text-title" style={{ color: "var(--color-text)" }}>
          {title}
        </h2>
        {!isSingle && (
          <button
            type="button"
            onClick={toggleAll}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-tint)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        )}
      </div>

      <p
        className="text-body"
        style={{ color: "var(--color-text-secondary)", marginBottom: 20 }}
      >
        {description}
      </p>

      <div
        style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}
      >
        {exams.map((exam) => {
          const isOpen = openCode === exam.code;
          const examSelectedCount = selectedCountFor(exam);
          return (
            <details
              key={exam.code}
              open={isOpen}
              className="card"
              style={{ padding: "16px 18px" }}
            >
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  setOpenCode(isOpen ? null : exam.code);
                }}
                style={{
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--color-text)",
                      flexShrink: 0,
                    }}
                  >
                    {exam.code}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={exam.name}
                  >
                    {exam.name}
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color:
                        examSelectedCount > 0
                          ? "var(--color-tint)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {examSelectedCount}/{exam.modules.length}
                  </span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms ease",
                      color: "var(--color-text-secondary)",
                    }}
                  />
                </span>
              </summary>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                {exam.modules.map((module) => {
                  const isSelected = selected.includes(module.code);
                  return (
                    <button
                      key={module.code}
                      type="button"
                      onClick={() => toggleModule(module.code)}
                      aria-pressed={isSelected}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        border: `2px solid ${
                          isSelected ? "var(--color-tint)" : "var(--color-border-subtle)"
                        }`,
                        backgroundColor: isSelected
                          ? "color-mix(in srgb, var(--color-tint) 8%, var(--color-card))"
                          : "var(--color-card)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: isSingle ? 999 : 5,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `2px solid ${
                            isSelected ? "var(--color-tint)" : "var(--color-border-subtle)"
                          }`,
                          backgroundColor: isSelected ? "var(--color-tint)" : "transparent",
                        }}
                      >
                        {isSelected && (isSingle ? (
                          <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: "#fff" }} />
                        ) : (
                          <Check size={11} color="#fff" />
                        ))}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--color-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={module.name}
                      >
                        {module.name || module.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      <Button
        variant="primary"
        size="lg"
        leftIcon={Play}
        onClick={onStart}
        disabled={selected.length === 0 || starting}
        loading={starting}
        fullWidth
      >
        {startLabel}
      </Button>
    </div>
  );
}
