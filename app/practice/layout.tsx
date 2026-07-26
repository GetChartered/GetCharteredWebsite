import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isFeatureUnlocked } from "@/lib/featureAccess";

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!isFeatureUnlocked(session?.user?.sub)) {
    redirect("/");
  }

  return children;
}
