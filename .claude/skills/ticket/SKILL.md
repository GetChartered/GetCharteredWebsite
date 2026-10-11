---
name: ticket
description: Work a Notion ticket end to end - read it, branch, implement, verify, write the PR description linking the ticket, and move the ticket to review. Use when given a Notion ticket link or asked to pick up a ticket. Also files new tickets for problems found outside the current task.
argument-hint: <Notion ticket link or title> | new <short description>
---

# Work from a Notion ticket

Needs the Notion connector (`/mcp` → notion). If it isn't connected, say so and stop.

## Picking up a ticket (`/ticket <link or title>`)

1. **Read it.** Fetch the ticket (search by title if given words, not a link). Note the title, description,
   acceptance criteria, status, assignee, any ID property, and linked pages. If the acceptance criteria are
   missing or ambiguous, ask before starting.
2. **Check it belongs here.** If the work is in the other repo (app vs website) or in AWS, say so. If it
   spans both repos, plan one branch per repo.
3. **Branch** from the default branch: `<type>/<short-slug>` (`feat/`, `fix/`, `chore/`), prefixed with the
   ticket ID if the ticket has one, e.g. `fix/GC-42-exam-date-west-of-utc`.
4. **Move the ticket to "In progress"** (use the status options the database already has; don't invent
   new ones), and assign it to the person you're working with if it's unassigned.
5. **Do the work**, following `CLAUDE.md`. Verify as it says.
6. **Write the PR description** with the ticket link at the top, what changed and why, how it was
   verified, and any Lambda that must be deployed before merge. Push only after confirming with the user.
7. **Move the ticket to "In review"** (or the closest existing status) and add a comment with the PR link.
   Never mark a ticket done: that happens when the PR merges.

## Filing a ticket (`/ticket new <description>`)

For problems found while working on something else. Don't fix them inline.

1. Find the tickets database (search Notion; ask the user the first time if more than one matches).
2. Draft the ticket: a short title, what's wrong, where (file and line, or AWS resource), how it was found,
   and a suggested fix. No personal data, tokens or user IDs.
3. Show the draft and create it only after the user agrees.
