"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarPlus, ChevronDown, Crown, EyeOff, Loader2, Trophy, TrendingUp } from "lucide-react";
import { Button, StatTile } from "@/components/ui";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useProgressData } from "@/hooks/useProgressData";
import { formatLeaderboardName } from "@/lib/practice/leaderboardName";
import { currentWeek } from "@/lib/practice/progressStats";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/practice/types";

const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "var(--accent-gold)",
  2: "#C0C0C0",
  3: "#CD7F32",
};

function medalColorForRank(rank: number): string | undefined {
  return rank === 1 || rank === 2 || rank === 3 ? MEDAL_COLORS[rank] : undefined;
}

// Colorful initial-circle avatars (Duolingo/Strava-style) — the backend
// only ever gives us a display name, never a photo, so a hashed color +
// first initial is the only real per-person visual identity available.
const AVATAR_COLORS = [
  "var(--accent-blue)",
  "var(--accent-teal)",
  "var(--accent-purple)",
  "var(--accent-gold)",
  "var(--accent-green)",
  "var(--accent-red)",
];

function avatarColorFor(name: string): string {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initialFor(name: string): string {
  return formatLeaderboardName(name).trim().charAt(0).toUpperCase() || "?";
}

/** The ranked-list variant of LeaderboardData (opted in, has a cohort). */
type RankedLeaderboardData = Extract<LeaderboardData, { noCohort: false }>;

export function LeaderboardClient() {
  const {
    examsLoading,
    exams,
    examsError,
    selectedExamCode,
    selectExamCode,
    leaderboardLoading,
    leaderboardData,
    leaderboardError,
    optIn,
    refetch,
    examPrep,
  } = useLeaderboard();
  const { data: progressData } = useProgressData();
  const [decidingOptIn, setDecidingOptIn] = useState(false);

  const yourBreakdown = useMemo(() => currentWeek(progressData?.weeklyStats ?? []), [progressData]);

  // Exams the user has real exam-prep data for float to the top of the
  // picker — cheap prioritisation once My Exams (app/my-account) has real
  // data to draw on, no separate UI needed for it.
  const orderedExams = useMemo(() => {
    const registeredCodes = new Set(examPrep.map((e) => e.examCode));
    if (registeredCodes.size === 0) return exams;
    const registered = exams.filter((e) => registeredCodes.has(e.code));
    const rest = exams.filter((e) => !registeredCodes.has(e.code));
    return [...registered, ...rest];
  }, [exams, examPrep]);

  const rankedData: RankedLeaderboardData | null =
    leaderboardData?.optedIn === true && !leaderboardData.noCohort ? leaderboardData : null;

  const handleOptIn = async (value: boolean) => {
    setDecidingOptIn(true);
    await optIn(value);
    setDecidingOptIn(false);
  };

  if (examsLoading) {
    return (
      <div
        className="card"
        style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-tint)" }} />
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (examsError || exams.length === 0) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <AlertTriangle size={28} style={{ color: "var(--accent-red)", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--color-text)" }}>
          {examsError || "No exams are available right now — check back soon."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Exam picker, anchored with a quick "your rank" chip on the other
          end of the row rather than sitting as an isolated left-aligned
          cluster on a now-much-wider page. A dropdown rather than a pill
          row — exam names are full titles (e.g. "Business, Innovation and
          People"), not short codes, so a row of pills doesn't fit more than
          one or two before wrapping badly or overflowing. Exams the user
          has real exam-prep data for are sorted first (orderedExams). */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative", display: "inline-flex", minWidth: 0 }}>
          <select
            value={selectedExamCode ?? ""}
            onChange={(e) => selectExamCode(e.target.value)}
            aria-label="Select exam"
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              padding: "10px 40px 10px 16px",
              borderRadius: "var(--radius-md)",
              border: "2px solid var(--color-tint)",
              backgroundColor: "color-mix(in srgb, var(--color-tint) 10%, var(--color-card))",
              color: "var(--color-tint)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              maxWidth: "min(420px, 70vw)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {orderedExams.map((exam) => (
              <option key={exam.code} value={exam.code}>
                {exam.name || exam.code}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-tint)",
              pointerEvents: "none",
            }}
          />
        </div>

        {rankedData && (
          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-card-alt)",
            }}
          >
            Your rank:{" "}
            <strong style={{ color: "var(--color-text)" }}>
              {rankedData.yourRank != null ? rankedData.yourRank : "—"}
            </strong>{" "}
            of {rankedData.cohortSize}
          </span>
        )}
      </div>

      {leaderboardLoading && (
        <div
          className="card"
          style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-tint)" }} />
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Loading leaderboard…</p>
        </div>
      )}

      {!leaderboardLoading && leaderboardError && (
        <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <AlertTriangle size={28} style={{ color: "var(--accent-red)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--color-text)", marginBottom: 16 }}>{leaderboardError}</p>
          <Button variant="primary" size="md" onClick={refetch}>
            Retry
          </Button>
        </div>
      )}

      {!leaderboardLoading && !leaderboardError && leaderboardData && (
        <LeaderboardBody
          data={leaderboardData}
          decidingOptIn={decidingOptIn}
          onOptIn={handleOptIn}
          yourBreakdown={yourBreakdown}
        />
      )}
    </div>
  );
}

function LeaderboardBody({
  data,
  decidingOptIn,
  onOptIn,
  yourBreakdown,
}: {
  data: LeaderboardData;
  decidingOptIn: boolean;
  onOptIn: (value: boolean) => void;
  yourBreakdown: { newCorrect: number; reviewCorrect: number; score: number } | null;
}) {
  if (data.optedIn === null) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <div
          className="rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ width: 56, height: 56, backgroundColor: "rgba(0, 173, 181, 0.12)" }}
        >
          <Trophy size={26} style={{ color: "var(--accent-blue)" }} />
        </div>
        <h2 className="text-title" style={{ color: "var(--color-text)", marginBottom: 8 }}>
          Compare your progress with others
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" }}>
          Opting in shares your display name and weekly score with others preparing for the same exam. You can
          change this anytime.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 260, margin: "0 auto" }}>
          <Button variant="primary" size="lg" loading={decidingOptIn} onClick={() => onOptIn(true)} fullWidth>
            Opt in
          </Button>
          <Button variant="ghost" size="md" disabled={decidingOptIn} onClick={() => onOptIn(false)} fullWidth>
            Not now
          </Button>
        </div>
      </div>
    );
  }

  if (data.optedIn === false) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <div
          className="rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ width: 56, height: 56, backgroundColor: "rgba(0, 173, 181, 0.12)" }}
        >
          <EyeOff size={26} style={{ color: "var(--accent-blue)" }} />
        </div>
        <h2 className="text-title" style={{ color: "var(--color-text)", marginBottom: 8 }}>
          You&apos;re not visible on the leaderboard
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 20 }}>
          Turn it on to see how you compare with others in your cohort.
        </p>
        <Button
          variant="primary"
          size="lg"
          loading={decidingOptIn}
          onClick={() => onOptIn(true)}
          style={{ maxWidth: 260, margin: "0 auto" }}
          fullWidth
        >
          Turn on leaderboard
        </Button>
      </div>
    );
  }

  if (data.noCohort) {
    // Matches GetChartered_app's leaderboard screen exactly: noCohort means
    // "you haven't set up your exam sitting yet" (no /exam-prep entry for
    // this exam), and the fix is a link to My Exams — not silently
    // registering one on the user's behalf, which is what this page used to
    // do and is what caused exams the user never actually added to show up
    // in app/my-account's My Exams list.
    return (
      <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <div
          className="rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ width: 56, height: 56, backgroundColor: "rgba(0, 173, 181, 0.12)" }}
        >
          <CalendarPlus size={26} style={{ color: "var(--accent-blue)" }} />
        </div>
        <h2 className="text-title" style={{ color: "var(--color-text)", marginBottom: 20 }}>
          Set up your exam sitting to join your cohort&apos;s leaderboard
        </h2>
        <Link href="/my-account" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg" style={{ maxWidth: 260, margin: "0 auto" }} fullWidth>
            Set up exam sitting
          </Button>
        </Link>
      </div>
    );
  }

  const podium = data.entries.slice(0, 3);
  const rest = data.entries.slice(3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {podium.length > 0 && <PodiumRow entries={podium} yourRank={data.yourRank} />}

      {data.entries.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
            Nobody in your cohort has practised yet this week — be the first.
          </p>
        </div>
      ) : (
        <div className="leaderboard-grid">
          <RankedList entries={rest} startRank={4} yourRank={data.yourRank} />
          <YourStatsPanel data={data} yourBreakdown={yourBreakdown} />
        </div>
      )}
    </div>
  );
}

// Horizontal 2nd-1st-3rd podium — 1st place taller and centered, matching
// the "clear rank hierarchy at the top" pattern from Duolingo leagues /
// Strava segment leaderboards. Degrades gracefully for a 1- or 2-person
// cohort (no fabricated placeholder entries).
function PodiumRow({ entries, yourRank }: { entries: LeaderboardEntry[]; yourRank: number | null }) {
  const order = entries.length === 3 ? [1, 0, 2] : entries.length === 2 ? [1, 0] : [0];
  const barHeight = (place: number) => (place === 1 ? 120 : place === 2 ? 88 : 68);

  return (
    <div className="card" style={{ padding: "28px 24px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
        {order.map((idx) => {
          const entry = entries[idx];
          if (!entry) return null;
          const place = idx + 1;
          const isYou = place === yourRank;
          const medalColor = MEDAL_COLORS[place as 1 | 2 | 3];
          const avatarSize = place === 1 ? 76 : 60;

          return (
            <div key={place} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 160 }}>
              {place === 1 && <Crown size={22} style={{ color: medalColor, marginBottom: 6 }} />}
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  backgroundColor: `color-mix(in srgb, ${avatarColorFor(entry.name)} 18%, var(--color-card))`,
                  border: `3px solid ${medalColor}`,
                  fontSize: place === 1 ? 26 : 20,
                  fontWeight: 700,
                  color: avatarColorFor(entry.name),
                  marginBottom: 10,
                  flexShrink: 0,
                }}
              >
                {initialFor(entry.name)}
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: isYou ? 700 : 600,
                  color: "var(--color-text)",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
                title={formatLeaderboardName(entry.name)}
              >
                {formatLeaderboardName(entry.name)}
              </p>
              {isYou && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-blue)", marginTop: 2 }}>YOU</span>
              )}
              <p style={{ fontSize: 20, fontWeight: 800, color: "var(--color-tint)", margin: "4px 0 12px" }}>
                {entry.score}
              </p>
              <div
                style={{
                  width: "100%",
                  height: barHeight(place),
                  borderRadius: "10px 10px 0 0",
                  backgroundColor: `color-mix(in srgb, ${medalColor} 16%, var(--color-card-alt))`,
                  border: `1px solid ${medalColor}`,
                  borderBottom: "none",
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 10,
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 800, color: medalColor }}>{place}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Ranks below the podium (4th onward) — colorful avatar circle + more
// breathing room per row than the old plain-text list. No rank-change
// indicator: the backend only returns each entry's current score/rank, no
// historical snapshot to diff against, so one isn't fabricated here.
function RankedList({
  entries,
  startRank,
  yourRank,
}: {
  entries: LeaderboardEntry[];
  startRank: number;
  yourRank: number | null;
}) {
  if (entries.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>That&apos;s everyone in this cohort.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map((entry, i) => {
        const rank = entry.rank ?? startRank + i;
        const isYou = rank === yourRank;
        return (
          <div
            key={`${rank}-${entry.name}-${i}`}
            className="card"
            style={{
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              ...(isYou
                ? {
                    border: "2px solid var(--accent-blue)",
                    backgroundColor: "color-mix(in srgb, var(--accent-blue) 8%, var(--color-card))",
                    boxShadow: "0 4px 14px rgba(0, 173, 181, 0.18)",
                  }
                : {}),
            }}
          >
            <span
              style={{
                width: 28,
                fontSize: 14,
                fontWeight: 700,
                color: medalColorForRank(rank) ?? "var(--color-text-secondary)",
                flexShrink: 0,
                textAlign: "center",
              }}
            >
              {rank}
            </span>
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                backgroundColor: `color-mix(in srgb, ${avatarColorFor(entry.name)} 18%, var(--color-card))`,
                color: avatarColorFor(entry.name),
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {initialFor(entry.name)}
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: isYou ? 700 : 500, color: "var(--color-text)" }}>
              {formatLeaderboardName(entry.name)}
              {isYou && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: "var(--accent-blue)" }}>YOU</span>
              )}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", flexShrink: 0 }}>
              {entry.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Sticky "your position" panel — the freed-up horizontal space from the
// wider container goes here rather than a large dead margin beside a
// narrow list. `position: sticky` keeps it in view while a long ranked
// list scrolls past, which is the practical version of "pin your row":
// CSS sticky pins to a scroll-container edge, it can't pin an arbitrary
// row mid-list, so the panel — which already shows your rank/score/
// breakdown — is what stays pinned instead.
function YourStatsPanel({
  data,
  yourBreakdown,
}: {
  data: RankedLeaderboardData;
  yourBreakdown: { newCorrect: number; reviewCorrect: number; score: number } | null;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 24,
        position: "sticky",
        top: 96,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h2 className="text-title" style={{ color: "var(--color-text)" }}>
        Your position
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Rank &amp; score</p>
        <InfoTooltip label="How score is calculated">
          Your score combines new questions and review questions you&apos;ve answered correctly
          this week. Review questions count double, since they&apos;re harder to keep fresh in
          memory. Only you can see your own breakdown — everyone else just sees your total
          score.
        </InfoTooltip>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <StatTile
          icon={Trophy}
          label="Rank"
          value={data.yourRank != null ? String(data.yourRank) : "—"}
          caption={`of ${data.cohortSize}`}
          color="var(--accent-gold)"
        />
        <StatTile
          icon={TrendingUp}
          label="Score"
          value={data.yourScore != null ? String(data.yourScore) : "—"}
          color="var(--color-tint)"
        />
      </div>

      {yourBreakdown && (
        <div style={{ paddingTop: 14, borderTop: "1px solid var(--color-border-subtle)" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>This week&apos;s breakdown</p>
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>{yourBreakdown.newCorrect}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>New correct</p>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>{yourBreakdown.reviewCorrect}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Review correct</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
