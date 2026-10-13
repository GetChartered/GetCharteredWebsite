---
name: accessibility
description: Build the GetChartered website (Next.js 16, React 19, Tailwind 4) to WCAG 2.2 AA and prove it in two layers - component-level checks (semantics, names, keyboard) and a real-browser Playwright + axe scan of every route in light and dark mode, with a bundled scan script. Covers landmarks and headings, names, keyboard and focus (dialogs, modals, route changes), visible focus, colour and contrast from tokens, motion (Framer Motion, ScrollReveal, the 3D hero), charts (Recharts), forms and errors, live updates, and target size. Use when building or reviewing any website page or component, when axe or a contrast check fails, or before a release. Not for the mobile app (gc:app-accessibility in ../GetChartered) or token values (gc:design-tokens).
---

# gc-web:accessibility

**Verified 2026-10-13:** `templates/a11y-scan.mjs` ran (Playwright with Chromium headless shell 156,
`@axe-core/playwright`, installed in a scratch directory) against `npm run build && npm run start`. It covered
7 public routes (`/`, `/about`, `/faq`, `/privacy`, `/terms`, `/cookies`, `/contact`) × light and dark × 1280 px
and 375 px.

The result was **exit 1, with 81 serious or critical violations across 4 rules** (see "What went wrong"). axe
couldn't decide contrast on `/`, `/about` and `/cookies` (gradients and images). Signed-in routes weren't
scanned, because there's no saved test login yet. The component-level layer has no runner yet.

The baseline, measured on 2026-10-13:
- `<html lang="en">` is set.
- Components use `aria-label` 34 times and `aria-hidden` 6 times.
- `globals.css` sets `outline: none` in two rules, with a comment about keyboard focus at line 830.
- Reduced motion is handled in `globals.css`, `ScrollReveal`, `HeroGraphic`, `AmbientBlob` and `HeroPhone`.
- There are no automated accessibility checks.

## The standard

WCAG 2.2 AA, in light and dark mode, at 320 px width and on desktop.

## Two layers, both required

In earlier work, a real-browser pass found defects that component-level (jsdom) tests had passed:
contrast failures from nested tints, a component's own `<header>` becoming a duplicate `banner` landmark, and a
visually-hidden utility defined in one component's CSS. Treat both layers as mandatory.

1. **Component level, while building:**
   - semantic elements first (`button`, `a`, `nav`, `main`, `h1`–`h3`, `label`);
   - an accessible name for every control;
   - a keyboard path through every interaction.

   Once the site has a test runner, add Testing Library role-and-name tests with `jest-axe` or `vitest-axe`.
2. **Real browser, before done:**
   - `templates/a11y-scan.mjs` drives Playwright + `@axe-core/playwright` over a list of routes in light and
     dark mode. It fails on any serious or critical violation.
   - Run it against `npm run build && npm run start`, not the dev server (dev overlays add their own DOM).
   - Signed-in routes need a test account's session. Until there's a saved login state, scan the public routes
     and check signed-in pages with the keyboard by hand.

```bash
# from the website repo, with the site running on :3000
node ${CLAUDE_SKILL_DIR}/templates/a11y-scan.mjs http://localhost:3000 / /about /faq /privacy /terms /cookies
```

The script installs nothing into the website. It needs `playwright` and `@axe-core/playwright` resolvable, so
run it from a scratch directory where they're installed (the script's header gives the exact commands).

## Build rules

| Area | Rule |
|---|---|
| Landmarks | One `header`/`banner`, one `nav` per navigation, one `main`, one `footer`, all from the layout. A component never renders its own `<header>` landmark. Each page has exactly one `h1`, and headings don't skip levels |
| Names | Every control and link has a name. Icon-only buttons have `aria-label`. Links say where they go ("View pricing", not "Click here"). Decorative SVGs, blobs and the 3D hero are `aria-hidden="true"` |
| Keyboard | Everything is reachable and operable with the keyboard, in a logical order. Custom toggles use `button` with `aria-pressed`. Accordions (`FaqAccordion`) use `button` with `aria-expanded` and `aria-controls` |
| Focus visible | Never remove the outline without a replacement. Use `:focus-visible` styles that reach 3:1 against both the control and the page, in both themes. Recheck the two `outline: none` rules in `globals.css` |
| Focus management | Modals (`LegalModal`, the practice calculator and tax-table modals, the exam result modal) trap focus, close on Escape and return focus to their trigger. After a client-side route change, focus moves to the `h1` |
| Colour | Never the only signal (correct or incorrect answers, strong or weak modules, chart series). Text uses token pairs that pass the contrast check in `gc:design-tokens` |
| Contrast caveat | axe reports contrast as "incomplete" over gradients and images (the hero, ambient blobs). Keep text on solid token backgrounds there, and say in the PR what axe couldn't check, rather than hiding it |
| Motion | `prefers-reduced-motion` gives the same content without movement: Framer Motion variants, `ScrollReveal`, and a still poster instead of the rotating 3D phone |
| Charts | Each Recharts chart has a text summary or a data table alternative, and the series differ by more than colour |
| Forms | Every input has a `label`. Errors are announced (`aria-describedby` plus `aria-live="polite"` or focus moved to the summary), and required fields say so in text |
| Live updates | Saved, failed and retry messages go in a polite live region |
| Targets | At least 24×24 px (WCAG 2.2 2.5.8); 44 px for primary actions on touch |
| Reflow | Works at 320 px wide and 400% zoom without horizontal scrolling, except data tables |

## Definition of done (per page or component)

- [ ] Semantic structure: one `h1`, landmarks from the layout only, headings in order.
- [ ] Every control has a name, and keyboard-only use completes the page's tasks.
- [ ] Focus is visible in both themes, and modals trap and restore it.
- [ ] Nothing is conveyed by colour alone; text uses passing token pairs.
- [ ] Reduced motion keeps the content.
- [ ] `a11y-scan.mjs` shows 0 serious or critical issues on the changed public routes in both themes.
  Signed-in routes are checked with the keyboard.
- [ ] Anything axe marked "incomplete" is named in the PR.
- [ ] `gc-web:accessibility-reviewer` has been run for anything larger than a copy change.

## What went wrong

Found by the first scan (2026-10-13). None is fixed yet; each needs a ticket.

| Symptom | Cause | Fix |
|---|---|---|
| `button-name` (critical) on every page, both themes, both widths | The theme toggle (`components/Navigation.tsx:266`) is an icon-only `Button` with no `aria-label` | Add `aria-label` ("Switch to dark mode" or "Switch to light mode") and `aria-pressed` |
| `color-contrast` on every page: teal `ghost` buttons on white (2.74:1) and white on teal primary buttons (2.74:1) | Brand teal `#00ADB5` used for text and button backgrounds | The same failure the token contrast gate reports. A darker text-safe teal (`gc:design-tokens`) |
| `target-size` on every page: nav, footer and table-of-contents links 17 px tall | Text links with no padding | Pad links to at least 24 px tall, or space them (WCAG 2.2 2.5.8) |
| `aria-hidden-focus` on `/` in dark mode, desktop | `.hero-graphic` is `aria-hidden` but contains a focusable element | Make the content inside it unfocusable (`tabIndex={-1}` / `inert`) or don't hide it |

Also seen while reading the code: buttons are nested inside links (`<Link><Button>`), which gives two
interactive elements for one control. axe didn't flag it, but check with a screen reader. Render a link styled as
a button instead.

## Test traps seen in earlier work (not yet hit here)

| Symptom | Fix |
|---|---|
| A scan never settled while an animation looped | Don't wait for `networkidle`; wait for `main h1` and no `[aria-busy=true]` |
| Contrast results were flaky on a dialog | Wait for `document.getAnimations()` to finish before scanning |
| A "fresh" browser context still had a session | Pass an empty `storageState` explicitly |
