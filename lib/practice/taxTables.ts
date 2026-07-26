// Placeholder — content to be populated by the team. Ported from
// GetChartered_app's assets/tax-tables.ts, which carries the same
// "placeholder" note — this is not yet real exam-reference content.
// Structure: an array of named tables, each with a title and rows of
// label/value pairs.

export interface TaxTableRow {
  label: string;
  value: string;
}

export interface TaxTable {
  id: string;
  title: string;
  rows: TaxTableRow[];
}

export const TAX_TABLES: TaxTable[] = [
  {
    id: "TAX_INCOME",
    title: "Income Tax Bands (2024/25)",
    rows: [
      { label: "Personal Allowance", value: "Up to £12,570 — 0%" },
      { label: "Basic Rate", value: "£12,571 – £50,270 — 20%" },
      { label: "Higher Rate", value: "£50,271 – £125,140 — 40%" },
      { label: "Additional Rate", value: "Over £125,140 — 45%" },
    ],
  },
  {
    id: "TAX_CGT",
    title: "Capital Gains Tax Rates (2024/25)",
    rows: [
      { label: "Annual Exempt Amount", value: "£3,000" },
      { label: "Basic Rate (residential)", value: "18%" },
      { label: "Higher Rate (residential)", value: "24%" },
      { label: "Basic Rate (other assets)", value: "10%" },
      { label: "Higher Rate (other assets)", value: "20%" },
    ],
  },
  {
    id: "TAX_NIC",
    title: "National Insurance (2024/25)",
    rows: [
      { label: "Primary Threshold", value: "£12,570" },
      { label: "Upper Earnings Limit", value: "£50,270" },
      { label: "Class 1 Employee (basic)", value: "8%" },
      { label: "Class 1 Employee (above UEL)", value: "2%" },
    ],
  },
];
