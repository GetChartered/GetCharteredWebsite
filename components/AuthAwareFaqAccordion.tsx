"use client";

import { useUser } from "@auth0/nextjs-auth0";
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
  const { user } = useUser();
  const visibleItems = user
    ? items.filter((item) => item.question !== hideQuestionWhenLoggedIn)
    : items;
  return <FaqAccordion items={visibleItems} />;
}
