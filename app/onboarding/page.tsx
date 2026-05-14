import { requireSession } from "@/lib/auth0";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  // Server-side gate: unauthenticated users are bounced to login before the
  // client form renders. Email verification is enforced by Auth0 at signup.
  await requireSession("/onboarding");

  return <OnboardingForm />;
}
