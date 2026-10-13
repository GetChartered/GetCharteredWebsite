---
name: website
description: Entry point for work on the GetChartered website (getchartered.app), the ICAEW ACA exam-revision product's web client. Next.js 16 App Router, React 19, Tailwind 4, Auth0 v4, Stripe checkout, hosted on Netlify, calling the shared AWS API from the server only. Gives the site map, the non-negotiable rules, which gc-* skill does each job, the order of work and the definition of done. Use when starting any website task or ticket, adding a page or route handler, or touching Netlify, auth, pricing or ported app logic. Not for the mobile app or Lambdas (gc:getchartered in ../GetChartered) or the mechanics of one route (gc-web:feature).
---

# gc-web:website

**Adapted 2026-10-13** from this repo's `CLAUDE.md`, `.github/workflows/ci.yml` and the app repo's
`docs/architecture.md`. Not yet used to drive a piece of work.

The website covers marketing pages, account management, Stripe checkout, and web versions of practice,
progress, the study planner and the leaderboard. It shares the AWS backend with the mobile app. The system map
and the backend live in the app repo at `../GetChartered`. Read `../GetChartered/.claude/kit/plugins/gc/skills/getchartered/SKILL.md`
for anything beyond this site.

## Read first

| What | Where |
|---|---|
| The system, every API route and its Lambda | `../GetChartered/docs/architecture.md` |
| Decisions shared by the app and website (exam results, billing, and so on) | `../GetChartered/docs/decisions.md` |
| The work itself | GC Work Board in Notion (`/gc-web:ticket`) |
| Question-data rules (the website has its own normaliser port) | `../GetChartered/docs/question-bank-validation.md` |
| Integrations, accounts and what Claude may do with each | `../GetChartered/.claude/kit/plugins/gc/skills/getchartered/references/integrations.md` |
| Review severity and evidence | `../GetChartered/.claude/kit/plugins/gc/skills/getchartered/references/review-protocol.md` |
| UK GDPR, store and ICAEW obligations (cookies, legal pages, wording) | `../GetChartered/.claude/kit/plugins/gc/skills/getchartered/references/compliance.md` |

## Non-negotiables

The same rules as the app's (only number 7 names the website's file). Change them in both repos at once.

1. **Production is the only environment.** Every write to AWS, EAS, Netlify or Stripe asks first. Code is
   deployed from git, never edited in a console.
2. **Identity comes from the token only.** Lambdas take the user from the JWT `sub`. No route accepts a user id
   in the path, query or body. The website calls the API from the server only (`callGcApi`), never from the
   browser.
3. **No personal data or tokens** go into logs, analytics events, tickets, commits, fixtures or screenshots.
4. **A Lambda change is deployed before or with the PR that depends on it**, and the PR says so in its first
   line.
5. **Ported logic stays in step.** When a website file mirrors an app file, change both, or say in the PR why
   not.
6. **Exam-body facts come from the exam body.** Never invent exam dates, entry deadlines, results days or pass
   marks. Local calendar dates (`YYYY-MM-DD`) are never parsed as UTC.
7. **Question data has one choke point and one judge.** On the website the choke point is
   `lib/practice/normaliseQuestion.ts`. A question that fails is skipped and flagged, never patched.
8. **Colour is never the only signal**, and text meets WCAG 2.2 AA contrast on the token pairs it uses.
9. **Every new third party sits behind a port with a local stand-in**, so new code runs and tests without keys.
   Existing integrations are moved behind ports when they're next changed.

## Stack and which skill does each job

| Concern | Choice | Skill |
|---|---|---|
| Work tracking | Notion GC Work Board | `gc-web:ticket` |
| Pages, route handlers, gating, API calls | Next.js 16 App Router; `callGcApi` from server code; `requireSession` / `requireOnboardedSession` | `gc-web:feature` |
| Accessibility | WCAG 2.2 AA; component checks plus Playwright + axe in a real browser | `gc-web:accessibility` |
| Design tokens | The `@theme` block in `app/globals.css`, generated from the shared token source | `gc:design-tokens` (app repo) |
| Test fixtures | Generated from the shared seed generator | `gc:seed-data` (app repo) |
| Hosting | Netlify site `getchartered`; deploy previews per PR; `netlify.toml` | This skill, "Netlify" below |
| Backend changes the site needs | Node Lambdas in `../GetChartered/backend` | `gc:backend-lambda` (app repo) |
| Review | Read-only reviewer agents in `.claude/kit/plugins/gc-web/agents/` (copied from the app repo) | `gc:getchartered` → "Review" |

This kit is the optional `gc-web` plugin in `.claude/kit/`; each person turns it on for themselves (see the app
repo's `gc:getchartered`, "The kit is optional"). App-repo skills are the `gc` plugin there. From this repo, read
`../GetChartered/.claude/kit/plugins/gc/skills/<name>/SKILL.md` directly.

## Layout

```
app/                    routes; app/api/* are same-origin route handlers that proxy the backend API
lib/gcApi.ts            callGcApi(): the only way to call the backend API
lib/auth0.ts            session helpers (requireSession, requireOnboardedSession)
lib/requireGatedAccess.ts, featureAccess.ts, examAccess.ts   premium and test-account gating
lib/features.ts         feature flags from env vars (NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED, NEXT_PUBLIC_ONBOARDING_REQUIRED)
lib/practice/, lib/studyPlanner/, lib/tour/   logic, much of it ported from the app (marked in a comment)
components/             UI; components/account/ holds the My Account sections
proxy.ts                Next 16 middleware: the Auth0 middleware on every route
backend-reference/      Lambda code written here for someone to deploy (moving to ../GetChartered/backend)
public/                 static files, including the versioned legal documents
netlify.toml            the netlify.app → getchartered.app redirect
```

## Order of work

1. **Start from a ticket** (`/gc-web:ticket <link>`), or file one for a problem outside the task.
2. **Read** the ticket and any decision in `../GetChartered/docs/decisions.md` that touches it.
3. **Place the change:**
   - Does it need a backend change? If so, it goes in the app repo first (`gc:backend-lambda`) and is deployed
     before or with this PR.
   - Does it touch a ported file? If so, the app copy changes too.
4. **Branch** from `main`.
5. **Build** with `gc-web:feature`, then work through `gc-web:accessibility`.
6. **Verify:** run the commands below, then `npm run dev` and look at the page in light and dark mode and at
   mobile width. After pushing, check the Netlify deploy preview.
7. **Review** with the agents that apply (security for anything touching auth, the server/client boundary or
   user data; accessibility for any UI; compliance for pricing, legal, cookies or ICAEW wording).
8. **Open the PR** after confirming. The ticket link goes at the top, followed by any Lambda that must be
   deployed first. Comment the PR link on the ticket.

## Definition of done

- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run build` pass. CI runs them on every PR; without real
  env vars, use the placeholder values in `.github/workflows/ci.yml`.
- [ ] The page has been seen running: light and dark, 375 px and desktop, keyboard only.
- [ ] `gc-web:accessibility` checklist done.
- [ ] **Backend calls** go through `callGcApi` from server code, after `requireSession` or
  `requireOnboardedSession`. No access token reaches the browser.
- [ ] **Failure handling:** a failed or missing backend call shows an inline error with a retry, never an
  uncaught exception. One failing section doesn't blank the whole page.
- [ ] **Ported logic:** both copies changed, or the PR says why not.
- [ ] **Netlify deploy preview** built and checked.
- [ ] **Legal documents** are new versioned files in `public/`, never edits to a published one.
- [ ] **Scripts** are cross-platform: a contributor develops on Windows.
- [ ] **Gating:** `lib/featureAccess.ts` is a temporary test-account allowlist. Don't extend it; real gating
  goes through `requireGatedAccess` and the premium checks.
- [ ] **Data hygiene:** no personal data or tokens in the diff, the PR or the ticket, and `.env*` files are
  never committed.

## Netlify

- Read deploy status and build logs freely. Production deploys, env var changes and DNS changes ask first.
- **DNS also serves `auth.getchartered.app` (Auth0).** A wrong record breaks sign-in for the app as well as
  the site.
- Env vars are set per context: production, deploy previews and branch deploys. A feature flag that works in
  a preview may be off in production. Check the context before saying a feature is live.

## What went wrong

Each of these happened on this site.

| Symptom | Cause | Fix now in place |
|---|---|---|
| `npm run build` failed in CI | `Auth0Client` is constructed at module level and throws without env vars | Placeholder env values in `ci.yml` (see its comment) |
