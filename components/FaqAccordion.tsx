"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: React.ReactNode };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <details
            key={faq.question}
            open={isOpen}
            className="card"
            style={{ padding: "20px 24px" }}
          >
            <summary
              onClick={(e) => {
                e.preventDefault();
                setOpenIndex(isOpen ? null : i);
              }}
              style={{
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "16px",
                color: "var(--color-text)",
                listStyle: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <span>{faq.question}</span>
              <ChevronDown
                size={20}
                style={{
                  flexShrink: 0,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                }}
              />
            </summary>
            <div
              className="mt-4 space-y-3"
              style={{
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {faq.answer}
            </div>
          </details>
        );
      })}
    </div>
  );
}
