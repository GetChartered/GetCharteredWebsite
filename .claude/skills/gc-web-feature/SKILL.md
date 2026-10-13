---
name: gc-web-feature
description: Build or change a page, route handler or feature on the GetChartered website (Next.js 16 App Router with Turbopack, React 19, Tailwind 4, @auth0/nextjs-auth0 v4, Netlify). Covers server-only backend calls through callGcApi after requireSession / requireOnboardedSession, same-origin app/api proxies, input checking, inline error and retry states, re-throwing Next control-flow errors, premium and feature-flag gating, ported app logic, tokens, and verification with tsc, lint, build and a Netlify deploy preview. Use when adding or changing a website route, page, component or API proxy, or when the build, typecheck or a deploy preview fails. Not for accessibility method (gc-web-accessibility), Lambdas (gc-backend-lambda in ../GetChartered) or the app (gc-app-feature).
---

# gc-web-feature

**Verified 2026-10-13 on `main` + this kit's branch:**
- After `npm ci`, `npx tsc --noEmit`, `npm run lint` and `npm run build` (Next.js 16.3.4, Turbopack) all pass.
- Before `npm ci` they failed (see "What went wrong").

The order of work comes from the existing routes (`app/api/exam-prep/route.ts` and others). It hasn't yet been
followed end to end through this skill.

## Where things go

| What | Where |
|---|---|
| A page | `app/<route>/page.tsx` (server component by default); client parts in `components/<area>/…Client.tsx` with `"use client"` |
| A same-origin API proxy | `app/api/<path>/route.ts`: gate, validate, call `callGcApi`, map the result |
| Backend calls | `lib/gcApi.ts` (`callGcApi`, `server-only`), plus helpers like `lib/practice/examPrepServer.ts` |
| Session guards | `lib/auth0.ts`: `getOptionalSession` (public pages), `requireSession`, `requireOnboardedSession` |
| Premium and test gating | `lib/requireGatedAccess.ts`, `lib/examAccess.ts`; `lib/featureAccess.ts` is a temporary allowlist |
| Feature flags | `lib/features.ts` (env: `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED`, `NEXT_PUBLIC_ONBOARDING_REQUIRED`) |
| Ported app logic | `lib/practice/`, `lib/studyPlanner/`, `lib/tour/` and some components; each says which app file it mirrors |
| Styles | Tailwind 4 with the tokens in `app/globals.css` (`--color-*`, `--spacing-*`, `--radius-*`) |
| Legal documents | `public/*_V<n>.html`, versioned |

## Order of work

1. **Read the backend route** in `../GetChartered/docs/architecture.md`. If the API needs a change, it's done
   first in the app repo (`gc-backend-lambda`) and deployed before or with this PR.
2. **The page or route handler gates first.**
   - Use `requireOnboardedSession(returnTo)` (or `requireSession` for onboarding itself).
   - Premium features also call `requireGatedAccess`.
   - Public marketing pages use `getOptionalSession` and never redirect.
3. **Call the backend only from the server**, with `callGcApi(path, options)`.
   - The browser talks only to `app/api/*` on the same origin.
   - Never import `lib/gcApi.ts` from a `"use client"` file. The `server-only` import makes the build fail if
     you do.
   - Never send the access token to the client.
4. **Validate input in the route handler.**
   - Parse JSON with `.catch(() => null)` and check each field's type.
   - Pass on only known fields (see `app/api/exam-prep/route.ts`).
   - Return a 400 with a short message on bad input, and a 502 when the backend failed.
5. **Handle failure in the UI.**
   - A failed backend call renders an inline error with a retry in the section that needed it.
   - The rest of the page still renders, with no uncaught exceptions.
   - In a server component's `try/catch`, call `if (isNextControlFlowError(error)) throw error;` first, or you
     swallow redirects and Next's dynamic-rendering signal.
6. **Ported logic.** If you change a file that mirrors app code, make the same change in the app, or say in the
   PR why not.
7. **Style from tokens.**
   - Use the `--color-*` variables and Tailwind classes built on them, not hex values.
   - Check light and dark mode, and widths of 375 px and desktop.
   - Then work through `gc-web-accessibility`.
8. **Verify:**
   - Run `npx tsc --noEmit`, `npm run lint` and `npm run build`.
   - Then `npm run dev` and use the feature: signed out, signed in without premium, signed in with premium,
     and with the backend failing (for example, offline).
9. **Open the PR** after confirming, then check the Netlify deploy preview builds and renders. Remember that
   preview env vars may differ from production.

## Rules

- **Dates:** exam dates are `YYYY-MM-DD` local dates. Don't `new Date()` them; use the helpers in
  `lib/practice/` (ported from the app's `parseExamDate`).
- **Questions:** question data is normalised only in `lib/practice/normaliseQuestion.ts` (non-negotiable 7).
- **Logging:** never log tokens, the `sub`, emails or request bodies. Log a fixed message and the error's name.
- **Secrets:** env vars come from Netlify (per context) or `.env.local`, which is never committed. Only
  `NEXT_PUBLIC_*` values reach the browser, so a secret never gets that prefix.
- **Scripts:** cross-platform (a contributor uses Windows). No bash-only `package.json` scripts.
- **Legal documents:** add a new versioned file and point the page at it; never edit a published version.

## Testing

There are no automated tests on the website yet. Until there are:
- **Logic:** put new logic in `lib/` as pure functions, so it can be tested once a runner is added. Port the
  app's Jest tests along with the logic when that happens.
- **Ported logic:** check it against the app's tests for the same file, with real inputs.
- **Accessibility:** the checks are in `gc-web-accessibility`.

## Definition of done

- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run build` pass. CI runs them.
- [ ] Every backend call goes through `callGcApi` from server code behind a session guard.
- [ ] Route handlers validate input and return 400 or 502 rather than throwing.
- [ ] Failure shows an inline error with a retry; a failing section doesn't blank the page.
- [ ] `try/catch` around session or profile code re-throws Next control-flow errors.
- [ ] Nothing on the never-log list is logged.
- [ ] Ported files and their app twins are in step, or the PR says why not.
- [ ] Seen in the browser: light and dark, 375 px and desktop, signed out, free and premium.
- [ ] `gc-web-accessibility` checklist done.
- [ ] The Netlify deploy preview is checked.

## What went wrong

| Symptom | Cause | Fix |
|---|---|---|
| `tsc` and `npm run build` failed with "Cannot find module '@google/model-viewer'" (2026-10-13) | Local `node_modules` was older than `package.json` (a dependency added on another branch) | `npm ci` after pulling. CI always does |
| A route was wrongly reported as "failed to resolve session" in `next build` | A `try/catch` around `auth0.getSession()` caught Next's `DYNAMIC_SERVER_USAGE` signal | `isNextControlFlowError` re-throw (`lib/auth0.ts`) |
| `npm run build` failed in CI | `Auth0Client` is constructed at module level and throws without env vars | Placeholder env values in `ci.yml` |
| Netlify's secrets scan failed a deploy | It scanned the build cache | `SECRETS_SCAN_OMIT_PATHS` set in Netlify |
| `requireOnboardedSession` logs `userId: session.user.sub` when the profile fetch fails (found 2026-10-13) | Written before the never-log rule | Not fixed; it needs a ticket. Log without the id |
