"use client";

import { useMemo } from "react";
import { TAX_TABLES } from "@/lib/practice/taxTables";
import { PracticeToolModal } from "@/components/practice/PracticeToolModal";

// Ported from GetChartered_app's components/TaxTableBottomSheet.tsx — shown
// only when the current question has taxTableRef data (see QuestionCard),
// filtered to just the relevant tables when refs are given, falling back to
// the full set otherwise (matches the app's own fallback).
export function TaxTableModal({ taxTableRef, onClose }: { taxTableRef: string[]; onClose: () => void }) {
  const tables = useMemo(() => {
    const refs = new Set(taxTableRef);
    const filtered = TAX_TABLES.filter((table) => refs.has(table.id));
    return filtered.length > 0 ? filtered : TAX_TABLES;
  }, [taxTableRef]);

  return (
    <PracticeToolModal title="Tax Tables" onClose={onClose} maxWidth={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {tables.map((table) => (
          <div key={table.id}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>
              {table.title}
            </h3>
            <div
              style={{
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              {table.rows.map((row, index) => (
                <div
                  key={`${table.id}-${row.label}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "9px 12px",
                    borderBottom: index < table.rows.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--color-text)", flex: 1 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0, textAlign: "right" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PracticeToolModal>
  );
}
