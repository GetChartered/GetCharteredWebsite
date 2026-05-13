// Gates subscription / payment features (Stripe checkout, billing portal, the
// pricing display, and post-checkout success page).
//
// Account login, signup, profile, and deletion are always available — users can
// sign up for early access independent of this flag.
//
// Set NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED="true" in the deployment environment
// once the GetChartered app is launched and ready to take payments.

export const SUBSCRIPTIONS_ENABLED =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === "false"

// When true, signed-in users with `onboarding_completed !== true` are
// redirected to /onboarding from protected pages, and the "Skip for now"
// escape on the onboarding flow is hidden. Defaults to true; set
// NEXT_PUBLIC_ONBOARDING_REQUIRED="false" to fall back to the soft-banner
// nudge.
export const ONBOARDING_REQUIRED =
  process.env.NEXT_PUBLIC_ONBOARDING_REQUIRED !== "false";
