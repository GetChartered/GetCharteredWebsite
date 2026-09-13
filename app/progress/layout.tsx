import { requireGatedAccess } from "@/lib/requireGatedAccess";

export default async function ProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGatedAccess("ProgressLayout");
  return children;
}
