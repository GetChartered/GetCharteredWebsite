# GetChartered website

The GetChartered website (`getchartered.app`) covers marketing pages, account management, Stripe checkout, and
web versions of practice, progress, the study planner and the leaderboard. It is built on Next.js 16 (App
Router), React 19, Tailwind 4 and Auth0 (`@auth0/nextjs-auth0` v4), and hosted on Netlify. It shares the AWS
backend with the mobile app, whose repo is usually checked out next to this one at `../GetChartered`.
**There is only a production environment.**

**Start with the `gc-website` skill.** It has the site map, which `gc-*` skill does each job, the order of
work and the definition of done. For the system and the backend, see `../GetChartered/docs/architecture.md`
and `../GetChartered/docs/decisions.md`.

## Non-negotiables

The same in the app's `CLAUDE.md` and both entry-point skills; change them everywhere at once.

1. **Production is the only environment.** Every write to AWS, EAS, Netlify or Stripe asks first. Deploy from
   git, never edit in a console.
2. **Identity comes from the token only.** The backend is called through `callGcApi()` from server components
   and route handlers only. Never call the API Gateway URL from client code or send the access token to the
   browser.
3. **No personal data or tokens** in logs, analytics, tickets, commits, fixtures or screenshots. `.env*` is
   never committed.
4. **A Lambda change is deployed before or with the PR that needs it**, and the PR says so in its first line.
5. **Ported logic stays in step.** Files that mirror app code say so in a comment. Change both copies, or say
   in the PR why not.
6. **Exam-body facts come from the exam body.** Never invent dates, deadlines or pass marks. Never parse a
   `YYYY-MM-DD` date as UTC.
7. **Question data has one choke point**: `lib/practice/normaliseQuestion.ts`, following the app's
   `docs/question-bank-validation.md`.
8. **Colour is never the only signal**, and text meets WCAG 2.2 AA contrast.
9. **Every new third party sits behind a port with a local stand-in.**

## Commands

CI (`.github/workflows/ci.yml`) runs the first three on every PR, and they must pass.

| What | Command |
|---|---|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Build | `npm run build` (without real env vars, use the placeholders in `ci.yml`) |
| Run locally | `npm run dev` |

## Git

- Branch from `main` and never commit to it directly. Keep unrelated files out of commits.
- Confirm before pushing. PRs are merged by a person, never by Claude.
- Judge each GitHub Copilot review comment on its merits rather than applying it as is.
