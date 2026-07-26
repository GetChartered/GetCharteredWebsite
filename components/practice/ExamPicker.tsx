"use client";

import { Check, Timer } from "lucide-react";
import { Button } from "@/components/ui";
import type { PracticeExamGroup } from "@/lib/practice/types";

type ExamPickerProps = {
  exams: PracticeExamGroup[];
  selectedCode: string | null;
  onChange: (code: string) => void;
  onStart: () => void;
  starting: boolean;
  numQuestions: number;
  timerLabel: string;
};

export function ExamPicker({
  exams,
  selectedCode,
  onChange,
  onStart,
  starting,
  numQuestions,
  timerLabel,
}: ExamPickerProps) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h2 className="text-title" style={{ color: "var(--color-text)", marginBottom: 8 }}>
        Choose your exam
      </h2>
      <p
        className="text-body"
        style={{ color: "var(--color-text-secondary)", marginBottom: 20 }}
      >
        Mock Exam draws {numQuestions} questions from every module in the exam you pick.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {exams.map((exam) => {
          const isSelected = selectedCode === exam.code;
          return (
            <button
              key={exam.code}
              type="button"
              onClick={() => onChange(exam.code)}
              aria-pressed={isSelected}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${isSelected ? "var(--color-tint)" : "var(--color-border-subtle)"}`,
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
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${isSelected ? "var(--color-tint)" : "var(--color-border-subtle)"}`,
                  backgroundColor: isSelected ? "var(--color-tint)" : "transparent",
                }}
              >
                {isSelected && <Check size={12} color="#fff" />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
                  {exam.code}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={exam.name}
                >
                  {exam.name} · {exam.modules.length} module{exam.modules.length === 1 ? "" : "s"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--color-text-secondary)",
          marginBottom: 16,
        }}
      >
        <Timer size={14} /> {numQuestions} questions · {timerLabel} · pass mark 55%
      </p>

      <Button
        variant="primary"
        size="lg"
        leftIcon={Timer}
        onClick={onStart}
        disabled={!selectedCode || starting}
        loading={starting}
        fullWidth
      >
        Start Mock Exam
      </Button>
    </div>
  );
}
