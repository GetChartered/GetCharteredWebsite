import { requireGatedAccess } from "@/lib/requireGatedAccess";

export default async function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGatedAccess("LeaderboardLayout");
  return children;
}
