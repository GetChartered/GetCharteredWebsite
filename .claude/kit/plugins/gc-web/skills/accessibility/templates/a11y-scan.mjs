#!/usr/bin/env node
// Real-browser accessibility scan for the GetChartered website: Playwright (Chromium) + axe-core, every route
// in light and dark mode, at desktop and phone widths. Fails (exit 1) on any serious or critical violation.
//
// Nothing is installed into the website. One-time setup in a scratch directory:
//   mkdir -p <scratch>/a11y && cd <scratch>/a11y && npm init -y >/dev/null \
//     && npm install playwright @axe-core/playwright && npx playwright install chromium
// Run (the site served by `npm run build && npm run start` on :3000):
//   NODE_PATH=<scratch>/a11y/node_modules node a11y-scan.mjs http://localhost:3000 / /about /faq
//
// Output: one line per route × theme × width, then every serious or critical violation with its nodes, then a
// list of what axe could not decide ("incomplete": usually contrast over gradients or images). Report those
// in the PR rather than hiding them.

import { createRequire } from "node:module";
import { join } from "node:path";

// Resolve from NODE_PATH (the scratch install) rather than from this file's location.
const require = createRequire(join(process.env.NODE_PATH ?? process.cwd(), "noop.js"));
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");

const [base, ...routes] = process.argv.slice(2);
if (!base || routes.length === 0) {
  console.error("usage: node a11y-scan.mjs <base-url> <route> [route ...]");
  process.exit(2);
}

const THEMES = ["light", "dark"];
const WIDTHS = [{ name: "desktop", width: 1280, height: 900 }, { name: "phone", width: 375, height: 812 }];
const BLOCKING = new Set(["serious", "critical"]);
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const browser = await chromium.launch();
const blocking = [];
const incomplete = new Map();
try {
  for (const theme of THEMES) {
    for (const vp of WIDTHS) {
      // A fresh, empty context each time: no stored session or theme leaks between scans.
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
        reducedMotion: "reduce",
        storageState: { cookies: [], origins: [] },
      });
      // The site's no-flash script reads localStorage "theme" before first paint.
      await context.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
      const page = await context.newPage();
      for (const route of routes) {
        const res = await page.goto(base + route, { waitUntil: "domcontentloaded" });
        // Don't wait for network idle (looping animations never settle); wait for the page's h1 instead.
        await page.locator("h1").first().waitFor({ timeout: 15000 }).catch(() => {});
        await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const bad = results.violations.filter((v) => BLOCKING.has(v.impact));
        const theme_ = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
        console.log(`${String(res?.status()).padEnd(3)} ${theme.padEnd(5)} ${vp.name.padEnd(7)} ${route.padEnd(14)} ` +
          `data-theme=${theme_}  violations: ${results.violations.length} (${bad.length} serious/critical)  incomplete: ${results.incomplete.length}`);
        for (const v of bad) blocking.push({ route, theme, width: vp.name, v });
        for (const i of results.incomplete) incomplete.set(`${route} ${i.id}`, i.help);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (blocking.length) {
  console.log(`\nSerious or critical violations (${blocking.length}):`);
  for (const { route, theme, width, v } of blocking) {
    console.log(`- [${v.impact}] ${route} (${theme}, ${width}) ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log(`    ${n.target.join(" ")}  ${n.failureSummary?.split("\n")[1]?.trim() ?? ""}`);
    if (v.nodes.length > 3) console.log(`    … and ${v.nodes.length - 3} more`);
  }
}
if (incomplete.size) {
  console.log(`\naxe could not decide (check by hand, and name them in the PR):`);
  for (const [k, help] of incomplete) console.log(`- ${k}: ${help}`);
}
process.exit(blocking.length ? 1 : 0);
