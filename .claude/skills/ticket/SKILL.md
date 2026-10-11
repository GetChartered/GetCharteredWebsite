---
name: ticket
description: Work a ticket from the GC Work Board in Notion end to end - read it, branch, implement, verify, write the PR description linking the ticket, and comment the PR on the ticket. Use when given a Notion ticket link or asked to pick up a ticket. Also files new tickets for problems found outside the current task.
argument-hint: <Notion ticket link or title> | new <short description>
---

# Work from a Notion ticket

Needs the Notion connector (`/mcp` → notion). If it isn't connected, say so and stop.

**The board:** 🏂 GC Work Board (GetChartered Hub), data source
`collection://2ee00ac1-8d1a-8013-b8e8-000b1c67b56c`. Properties:
- `Name`, `Description`, `Owner` (person), `Due`, `Related Epic` (relation)
- `Priority`: High / Medium / Low Priority
- `Status`: Backlog → In progress → Testing → Done (or Archived)
- `TYPE TAGS`: Mobile, Website, Bug, Design, Learning Materials, Admin, Marketing, Partnerships

There is no ticket ID property.

## Picking up a ticket (`/ticket <link or title>`)

1. **Read it.** Fetch the ticket (search by title if given words, not a link) and any linked pages or epic.
   Note the description, acceptance criteria, status and owner. If what "done" means is missing or
   ambiguous, ask before starting.
2. **Check it belongs here.** `Mobile` work is in the `GetChartered` repo, and `Website` work is in
   `GetCharteredWebsite`. AWS work goes in `backend/` (see `docs/architecture.md`). If it spans repos,
   plan one branch per repo.
3. **Branch** from the default branch: `<type>/<short-slug>`, e.g. `fix/exam-date-west-of-utc`.
4. **Set Status to "In progress"**, and Owner to the person you're working with if it's empty.
5. **Do the work**, following `CLAUDE.md`. Verify as it says.
6. **Write the PR description** with the ticket link at the top, what changed and why, how it was
   verified, and any Lambda that must be deployed before merge. Push and open the PR only after
   confirming with the user.
7. **Comment on the ticket** with the PR link and a one-line summary. Leave Status as "In progress":
   people move tickets to Testing and Done.

## Filing a ticket (`/ticket new <description>`)

For problems found while working on something else. Don't fix them inline.

1. Draft the ticket:
   - `Name`: short and specific
   - `Description`: what's wrong, where (file and line, or AWS resource), how it was found, and a
     suggested fix
   - `Status`: Backlog
   - `TYPE TAGS`: Mobile and/or Website, plus Bug if it's a defect
   - `Priority`: a suggestion, with the reason
   No personal data, tokens or user IDs.
2. Show the draft and create it only after the user agrees.
