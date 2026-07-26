// Temporary allowlist gating the practice/progress/leaderboard feature set
// (app/practice, app/progress, app/leaderboard, and their Navigation.tsx
// links) down to two specific Auth0 users while this work is unreconciled
// with Frank's parallel branch. Remove once the app is released and the two
// branches are merged — this isn't meant to be a long-lived mechanism.
export const ALLOWED_USER_IDS = [
  "auth0|6a19d2f8c88714c316665638", // Pierce's test account
  "auth0|68b6dee5aa15fc500775374d", // devs account
];

export function isFeatureUnlocked(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return ALLOWED_USER_IDS.includes(userId);
}
