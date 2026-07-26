// Privacy: the leaderboard shows first name + last initial, never a full
// name (e.g. "Sarah K." not "Sarah Kowalski"). Mirrors
// GetChartered_app's Learning/Utils/leaderboardName.ts — the backend only
// returns a single `name` field (no separate first/last), so this splits on
// whitespace rather than assuming a structured name.
export function formatLeaderboardName(fullName: string | null | undefined): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "Anonymous";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const lastInitial = parts[1]?.[0];
  return lastInitial ? `${first} ${lastInitial.toUpperCase()}.` : first;
}
