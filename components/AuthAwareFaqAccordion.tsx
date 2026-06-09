"use client";

import { useOptionalUser } from "@/lib/useOptionalUser";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";

// Wraps FaqAccordion to filter out a specific question for signed-in users,
// without forcing the surrounding page to be SSR'd just to read session.
export function AuthAwareFaqAccordion({
  items,
  hideQuestionWhenLoggedIn,
}: {
  items: FaqItem[];
  hideQuestionWhenLoggedIn: string;
}) {
  const { user } = useOptionalUser();
  const visibleItems = user
    ? items.filter((item) => item.question !== hideQuestionWhenLoggedIn)
    : items;
  return <FaqAccordion items={visibleItems} />;
}
