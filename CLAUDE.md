# GetChartered website — notes for Claude

The GetChartered website (`getchartered.app`): marketing pages, account management, Stripe checkout, and web
versions of practice, progress, the study planner and the leaderboard. Next.js 16 (App Router), React 19,
Tailwind 4, Auth0 (`@auth0/nextjs-auth0` v4), hosted on Netlify.

It shares the AWS backend with the mobile app (the `GetChartered` repo, usually checked out next to this
one at `../GetChartered`). Read these there before backend or cross-product work:
- `../GetChartered/docs/architecture.md`: the system, every API route and its Lambda, and which Lambdas
  are in git.
- `../GetChartered/docs/decisions.md`: product decisions shared by the app and website (exam results
  model, billing, and so on).

## Repo map

- `app/`: routes. `app/api/*` are same-origin route handlers that proxy the backend API.
- `lib/gcApi.ts`: `callGcApi()`, the only way to call the backend API (see Rules).
- `lib/auth0.ts`, `lib/auth0Client.ts`: session helpers (`requireSession`, `requireOnboardedSession`).
- `lib/requireGatedAccess.ts`, `lib/featureAccess.ts`, `lib/examAccess.ts`: gating for premium features.
- `lib/features.ts`: feature flags from env vars (`NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED`,
  `NEXT_PUBLIC_ONBOARDING_REQUIRED`).
- `lib/practice/`, `lib/studyPlanner/`, `lib/tour/`: logic, much of it ported from the app.
- `components/`: UI. `components/account/` holds the My Account sections.
- `proxy.ts`: Next 16's middleware. It runs the Auth0 middleware on every route.
- `backend-reference/`: Lambda code written here for someone to deploy. It is not deployed from here, and
  Lambda source should move to the app repo's `backend/` (or a future backend repo).
- `public/`: static files, including the versioned legal documents (`privacy_policy_V3.html`,
  `terms_and_conditions_V4.html` and so on). Add a new version rather than editing a published one.

## Verifying changes

CI (`.github/workflows/ci.yml`) runs these on every PR, and they must pass:
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`. Without real env vars, use the placeholder values from `ci.yml`.

There are no automated tests. For UI changes, run `npm run dev` and check the page in a browser.

## Rules

- **The backend is called from the server only.** Use `callGcApi()` from server components and route
  handlers, after `requireSession` / `requireOnboardedSession`. Never call the API Gateway URL from client
  code and never send the access token to the browser.
- **Ported logic must stay in step with the app.** Files that mirror app code say so in a comment (for
  example `lib/practice/normaliseQuestion.ts`, `examPrep.ts`, `calcEngine.ts`, `examVisuals.ts`,
  `leaderboardName.ts`). When you change one, check whether the app's version needs the same change, and
  say so in the PR.
- **Question data** follows the app's contract-first rules (`../GetChartered/docs/question-bank-validation.md`):
  format variance is handled only in `lib/practice/normaliseQuestion.ts`.
- **Backend changes:** if a website change needs a Lambda change, the Lambda must be deployed before or at
  merge. Say so prominently at the top of the PR description. There is only a production environment.
- **Don't break on a missing backend.** Routes handle a failed or missing backend call with an inline error
  and retry, never an uncaught exception (see `requireOnboardedSession` and `app/api/user/photo`).
- `lib/featureAccess.ts` is a temporary allowlist that limits practice, progress and the leaderboard to test
  accounts. Don't extend it into a permanent mechanism.
- Never log tokens or personal data. Env files (`.env*`) are never committed.
- Keep scripts cross-platform: at least one contributor develops on Windows.

## Tools and integrations

Connectors (MCP servers) are shared in `.mcp.json`. Each person signs in to their own account with `/mcp`.
Writes in every tool ask first (`.claude/settings.json`).

- **Notion (tickets):** `/ticket <link>` works a ticket end to end. When you find a problem outside the
  current task, offer `/ticket new …` instead of fixing it inline.
- **GitHub (`gh`):** read PRs, CI results and Copilot's review comments directly
  (`gh api repos/GetChartered/GetCharteredWebsite/pulls/<n>/comments` for inline comments). PRs are merged
  by a person, never by Claude (`gh pr merge` is blocked).
- **Netlify:** check deploy previews and read failed build logs. Production deploys, env var changes and
  anything touching DNS ask first. DNS also serves `auth.getchartered.app` (Auth0), so a wrong record
  breaks sign-in for the app as well as the site.
- **Stripe:** use test mode / a sandbox only. Live customer data stays out of sessions unless the person
  you're working with asks.
- **Auth0:** if connected, it is read-only (tenant changes are made by a person in the dashboard).

## Git and PRs

- Branch from `main` and never commit to it directly. Keep unrelated files out of commits.
- Confirm with the person you're working with before pushing.
- GitHub Copilot reviews PRs. Judge each of its comments on its merits rather than applying it as is.
