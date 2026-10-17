"use client";

import { useState } from "react";
import {
  BUTTON_ROWS,
  type CalcState,
  INITIAL,
  LIGHT_BTN,
  OPERATORS,
  deriveDisplay,
  next,
} from "@/lib/practice/calcEngine";
import { PracticeToolModal } from "@/components/practice/PracticeToolModal";

const POSITION_STORAGE_KEY = "practice:calculatorPosition";

// Ported from GetChartered_app's components/CalculatorBottomSheet.tsx — same
// Apple-style two-row display and button layout/colours (calcEngine.ts's
// BUTTON_ROWS/OPERATORS/LIGHT_BTN drive both, so the app and website stay in
// sync automatically if the button layout ever changes), as a modal instead
// of a bottom sheet. Draggable by its header (the app's bottom sheet has no
// equivalent — a fixed-position web modal needs one, so it can be moved off
// the question it's covering), with the dragged position persisted so
// reopening it later restores where the user left it.
export function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<CalcState>(INITIAL);
  const { calc: displayCalc, main: displayMain } = deriveDisplay(s);

  const press = (btn: string) => setS((prev) => next(prev, btn));

  return (
    <PracticeToolModal
      title="Calculator"
      onClose={onClose}
      maxWidth={380}
      draggable
      positionStorageKey={POSITION_STORAGE_KEY}
    >
      {/* The small row only renders once it has text (after "="), and the
          box is centred at a fixed min height (padding 28 + 18 + 4 + 40), so
          a lone expression sits in the middle instead of under an empty row,
          and the box doesn't resize on "=". */}
      <div
        style={{
          borderRadius: 14,
          backgroundColor: "var(--color-card-alt)",
          padding: "14px 16px",
          marginBottom: 16,
          minHeight: 90,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {displayCalc && (
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: "18px",
              textAlign: "right",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayCalc}
          </p>
        )}
        <p
          style={{
            color: "var(--color-text)",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: "40px",
            textAlign: "right",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayMain}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BUTTON_ROWS.map((row) => (
          <div key={row.join("-")} style={{ display: "flex", gap: 10 }}>
            {row.map((btn) => {
              const isOperator = btn === "=" || OPERATORS.includes(btn);
              const isUtility = (LIGHT_BTN as readonly string[]).includes(btn);
              const backgroundColor = isOperator
                ? "var(--color-tint)"
                : isUtility
                  ? "var(--color-text-secondary)"
                  : "var(--color-card-alt)";
              const color = isOperator || isUtility ? "#fff" : "var(--color-text)";

              return (
                <button
                  key={btn}
                  type="button"
                  className="calc-text-trim"
                  onClick={() => press(btn)}
                  style={{
                    flex: 1,
                    aspectRatio: "1",
                    borderRadius: 16,
                    border: "none",
                    backgroundColor,
                    color,
                    fontSize: 20,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </PracticeToolModal>
  );
}
