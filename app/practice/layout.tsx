import { requireGatedAccess } from "@/lib/requireGatedAccess";

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGatedAccess("PracticeLayout");
  return children;
}
