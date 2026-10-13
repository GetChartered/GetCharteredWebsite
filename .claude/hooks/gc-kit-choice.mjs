#!/usr/bin/env node
// Asks each person once whether they want this repo's optional GetChartered skill kit (a Claude Code plugin),
// and records the answer in their own .claude/settings.local.json, which git ignores.
//
//   node .claude/hooks/gc-kit-choice.mjs          SessionStart hook: ask once if no choice is recorded
//   node .claude/hooks/gc-kit-choice.mjs on       turn the kit on for me in this repo
//   node .claude/hooks/gc-kit-choice.mjs off      turn it off
//   node .claude/hooks/gc-kit-choice.mjs status   show my current choice
//
// The same file is used in the app and website repos; the plugin id comes from .claude/kit's marketplace.json.
// Node only, no dependencies, so it also runs on Windows.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const mode = process.argv[2] ?? "hook";
const quietExit = () => process.exit(0); // the hook must never block or clutter a session

let pluginId, pluginName;
try {
  const market = JSON.parse(readFileSync(join(repo, ".claude/kit/.claude-plugin/marketplace.json"), "utf8"));
  pluginName = market.plugins[0].name;
  pluginId = `${pluginName}@${market.name}`;
} catch {
  if (mode === "hook") quietExit();
  console.error("Couldn't read .claude/kit/.claude-plugin/marketplace.json.");
  process.exit(1);
}

const localPath = join(repo, ".claude/settings.local.json");
function readLocal() {
  if (!existsSync(localPath)) return {};
  return JSON.parse(readFileSync(localPath, "utf8")); // throws on invalid JSON; callers decide
}
function writeChoice(on) {
  const settings = readLocal();
  settings.enabledPlugins = { ...(settings.enabledPlugins ?? {}), [pluginId]: on };
  writeFileSync(localPath, JSON.stringify(settings, null, 2) + "\n");
}

const benefits = [
  "the team's non-negotiable rules and a map of the app, website and AWS, so it doesn't guess",
  "step-by-step guides with checklists for the common jobs (Lambdas, app screens, website pages, releases)",
  `/${pluginName}:ticket, which works a Notion ticket from branch to PR`,
  "read-only reviewers for security, accessibility, compliance and ticket coverage",
  "extra care before anything touches production",
];
const question =
  "This repo has an optional GetChartered skill kit for Claude. It gives Claude:\n" +
  benefits.map((b) => `- ${b}`).join("\n") +
  "\nIt only adds context when it's relevant to the task. Turn it on for you? (You can change this any time.)";

if (mode === "hook") {
  let settings;
  try {
    settings = readLocal();
  } catch {
    quietExit(); // unreadable local settings: don't touch them, don't ask
  }
  if (settings.enabledPlugins && pluginId in settings.enabledPlugins) quietExit(); // already chosen
  try {
    writeChoice(false); // record that we've asked, so it's asked only once; off until they say yes
  } catch {
    quietExit();
  }
  const context =
    `The person working in this repo hasn't chosen yet whether to use its optional GetChartered skill kit ` +
    `(Claude Code plugin ${pluginId}). It is off. At the start of your first reply in this session, before ` +
    `anything else, ask them once, in these words:\n\n${question}\n\n` +
    `If they say yes, run \`node .claude/hooks/gc-kit-choice.mjs on\` from the repo root, then tell them to run ` +
    `/reload-plugins or start a new session to load it. If they say no or don't answer, leave it off: that is ` +
    `already recorded and they won't be asked again. Either way, then carry on with what they asked. They can ` +
    `change their mind any time with \`node .claude/hooks/gc-kit-choice.mjs on\` or \`off\`, or in /plugin.`;
  process.stdout.write(
    JSON.stringify({
      systemMessage:
        "This repo has an optional GetChartered skill kit for Claude. Claude will ask once whether you want it; it stays off unless you say yes.",
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
    }),
  );
  process.exit(0);
}

if (mode === "on" || mode === "off") {
  try {
    writeChoice(mode === "on");
  } catch (e) {
    console.error(`Couldn't update .claude/settings.local.json (${e.message}). Fix or remove it, then try again.`);
    process.exit(1);
  }
  console.log(
    mode === "on"
      ? `GetChartered skill kit (${pluginId}) is now on for you in this repo. Run /reload-plugins or start a new session to load it.`
      : `GetChartered skill kit (${pluginId}) is now off for you in this repo. Run /reload-plugins or start a new session.`,
  );
  process.exit(0);
}

if (mode === "status") {
  let choice;
  try {
    choice = readLocal().enabledPlugins?.[pluginId];
  } catch {
    choice = "unreadable settings";
  }
  console.log(`${pluginId}: ${choice === true ? "on" : choice === false ? "off" : choice ?? "not chosen yet"}`);
  process.exit(0);
}

console.error("Usage: node .claude/hooks/gc-kit-choice.mjs [on|off|status]");
process.exit(2);
