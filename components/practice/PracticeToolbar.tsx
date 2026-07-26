"use client";

import { useState } from "react";
import { Calculator, Flag, SlidersHorizontal, Table } from "lucide-react";
import { CalculatorModal } from "@/components/practice/CalculatorModal";
import { TaxTableModal } from "@/components/practice/TaxTableModal";
import { PracticePreferencesModal } from "@/components/practice/PracticePreferencesModal";
import { usePracticePreferences } from "@/hooks/usePracticePreferences";

type ToolName = "calculator" | "taxTable" | "preferences" | null;

export interface PracticeToolbarProps {
  taxTableRef: string[];
  isFlagged: boolean;
  onToggleFlag: () => void;
  prefs: ReturnType<typeof usePracticePreferences>;
}

// One toolbar, shared by every question renderer via QuestionCard — the
// same "one toolbar wired to every question" shape as GetChartered_app's
// components/renderers/QuestionToolButtons.tsx. Bundles the calculator, a
// question-specific tax-table reference, the practice-preferences panel,
// and a per-question flag/bookmark toggle. All five practice modes get all
// four tools for free just by rendering QuestionCard — no per-mode wiring.
export function PracticeToolbar({ taxTableRef, isFlagged, onToggleFlag, prefs }: PracticeToolbarProps) {
  const [openTool, setOpenTool] = useState<ToolName>(null);
  const hasTaxTables = taxTableRef.length > 0;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <ToolbarButton icon={SlidersHorizontal} label="Practice preferences" onClick={() => setOpenTool("preferences")} />
        {hasTaxTables && (
          <ToolbarButton icon={Table} label="Tax tables" onClick={() => setOpenTool("taxTable")} />
        )}
        <ToolbarButton icon={Calculator} label="Calculator" onClick={() => setOpenTool("calculator")} />
        <ToolbarButton
          icon={Flag}
          label={isFlagged ? "Remove flag" : "Flag this question"}
          onClick={onToggleFlag}
          active={isFlagged}
        />
      </div>

      {openTool === "calculator" && <CalculatorModal onClose={() => setOpenTool(null)} />}
      {openTool === "taxTable" && <TaxTableModal taxTableRef={taxTableRef} onClose={() => setOpenTool(null)} />}
      {openTool === "preferences" && <PracticePreferencesModal prefs={prefs} onClose={() => setOpenTool(null)} />}
    </>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: typeof Calculator;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "var(--radius-md)",
        border: "none",
        background: "none",
        cursor: "pointer",
        color: active ? "var(--color-tint)" : "var(--color-text-secondary)",
      }}
    >
      <Icon size={18} fill={active ? "var(--color-tint)" : "none"} />
    </button>
  );
}
