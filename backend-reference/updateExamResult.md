# Exam result fields on `/exam-prep` — backend change needed

**Not deployed. Reference only — Pierce to review and deploy manually.**

This is a *different* situation from `updateUserPhoto.js` in this same
folder. That file is a complete, standalone Lambda written from scratch
against a brand-new route. This document is **not** a rewrite of an existing
Lambda — this session has no access to the real `/exam-prep` Lambda's source
(same gap noted in the earlier Phase 0 investigation: the app repo calls the
endpoint but doesn't contain its implementation), so there is nothing here
to safely present as "the real code, extended." What follows is the
**contract change** the website side now expects, plus a worked example of
what the DynamoDB update probably needs to look like, based on the same
patterns confirmed in `GetChartered_app/backend/recordAttemptLambda/index.js`
and this folder's own `updateUserPhoto.js`. **Locate the actual `/exam-prep`
Lambda in AWS first, then adapt this to its real structure** — don't paste
the snippet below in verbatim.

## What's changing

`POST /exam-prep` already accepts `{ course, examCode, year?, session?,
examDate?, isPrimary? }` and upserts a per-user record keyed by (course,
examCode), per the confirmed contract in
`GetChartered_app/components/useBackendData.tsx`. The website now also sends
three new optional fields on that same request:

| Field | Type | Meaning |
|---|---|---|
| `sat` | `boolean` | Has the user actually sat this exam, vs. just scheduled it |
| `gradePercent` | `number \| null` | Raw mark out of 100 the user entered |
| `examLevel` | `"certificate" \| "professional" \| "advanced"` | Which ICAEW ACA tier this exam belongs to — needed to know the pass mark (55% for Certificate/Professional, 50% for Advanced — see `lib/practice/examResults.ts`'s `getPassMark`). Pass/fail itself is **derived client-side, not stored** — don't add a `passed` field, just persist `gradePercent` and `examLevel` as sent. |

These three fields need to:
1. Be accepted on `POST /exam-prep` and written onto the same record the
   existing fields already update (same item, not a new one — `sat`/
   `gradePercent`/`examLevel` describe an *outcome* for an already-scheduled
   exam, not a separate entity).
2. Be echoed back on that record in both the `POST /exam-prep` response body
   and `GET /exam-prep`'s list — the website reads them from both places
   (`lib/practice/examPrep.ts`'s `parseExamPrepData`, used by both the
   fetch and the save-response paths).

**Currently**, since the real Lambda doesn't know about these fields, it
almost certainly just ignores them silently (extra JSON keys on a request
body are typically a no-op unless the Lambda does strict schema validation)
— the website degrades to that gracefully: recorded results simply won't
persist across a page reload until this is deployed. Confirm this
assumption once you have the real source; if it does strict validation
instead, requests carrying these new fields could be rejected outright.

## Judgement call: extend vs. new Lambda

Recommend **extending the existing `/exam-prep` Lambda** rather than adding
a new one: `sat`/`gradePercent`/`examLevel` are properties *of* an
exam-prep record, not a separate resource, and there's no obvious reason a
second write path to the same DynamoDB item would be simpler than adding
three more `SET` clauses to whatever `UpdateCommand` it already runs.

A new Lambda would only make sense if the existing one turns out to be
doing something that makes extending it awkward — e.g. if it's a
significantly different runtime (Python?), or has separate/stricter IAM
scoping in a way that makes co-locating this logic undesirable. That's a
call only Pierce can make with the real source in front of him — the point
above is a default recommendation, not a decision made blind.

## Illustrative pattern (not the real Lambda)

Written in the same style as `recordAttemptLambda`/`updateUserPhoto.js` in
this repo, to show the shape of the change — extract the actual
`UpdateCommand` (or equivalent) from the real Lambda and add to *that*,
don't use this verbatim:

```js
// Illustrative only — replace with the real /exam-prep Lambda's actual
// update logic. Shown here just to convey the shape of the change: three
// more attributes on the same UpdateCommand that already writes
// course/examCode/examDate/isPrimary/year/session.

const { sat, gradePercent, examLevel } = payload;

const updateExpressionParts = [
  "SET course = :course",
  "examCode = :examCode",
  // ...whatever the existing fields already do...
];
const expressionAttributeValues = {
  ":course": payload.course,
  ":examCode": payload.examCode,
  // ...existing values...
};

if (typeof sat === "boolean") {
  updateExpressionParts.push("sat = :sat");
  expressionAttributeValues[":sat"] = sat;
}
if (typeof gradePercent === "number" || gradePercent === null) {
  updateExpressionParts.push("gradePercent = :gradePercent");
  expressionAttributeValues[":gradePercent"] = gradePercent;
}
if (typeof examLevel === "string") {
  updateExpressionParts.push("examLevel = :examLevel");
  expressionAttributeValues[":examLevel"] = examLevel;
}

const command = new UpdateCommand({
  TableName: EXAM_PREP_TABLE, // whatever the real table name is
  Key: {
    /* the real Lambda's actual key shape — likely userId + a composite
       sort key of course#examCode, matching examKey's `${course}#${examCode}`
       format the website already derives client-side when the backend
       response omits it */
  },
  UpdateExpression: updateExpressionParts.join(", "),
  ExpressionAttributeValues: expressionAttributeValues,
});
```

## Response shape

Whatever `GET`/`POST /exam-prep` currently return for each entry (at least
`course`, `examCode`, `examDate`, `isPrimary` per the confirmed contract),
add `sat`, `gradePercent`, `examLevel` alongside them, omitting fields that
were never set (the website's parser — `lib/practice/examPrep.ts`'s
`parseExamPrepData` — already treats a missing field as `undefined`, not an
error).

## What Pierce needs to do

1. Locate the real `/exam-prep` Lambda in AWS (Console or wherever the
   infra-as-code for it lives, if any).
2. Add `sat`/`gradePercent`/`examLevel` handling to its update logic,
   following the pattern above adapted to its real structure.
3. Confirm the DynamoDB table's item schema allows these new attributes
   (DynamoDB is schemaless per-item, so this is likely a non-issue, but
   worth a sanity check if the table has any validation layer in front of
   it).
4. Confirm the same three fields are included in both `GET` and `POST`
   response bodies.
5. No API Gateway route or JWT authoriser change needed — `POST /exam-prep`
   already exists and is already authorised the same way every other route
   is; this is a body/response shape change only, not a new endpoint.
6. Test end-to-end from the live site — the frontend is already fully wired
   (`components/account/MyExamsSection.tsx` → `components/account/
   ExamResultModal.tsx` → `hooks/useExamPrep.ts` → `/api/exam-prep` →
   `lib/practice/examPrepServer.ts` → the real Gateway) and needs no further
   changes once the Lambda persists and returns these fields.

## One more flag: the exam-level lookup table itself

Separately from the backend change above, `lib/practice/examLevels.ts` guesses
each exam's level (Certificate/Professional/Advanced) from its code/name,
since `GET /courses` doesn't return one and there's no live backend access
from this environment to verify the *real* full set of ACA exam codes. Only
two codes are confirmed against real source (`BIP`, `ARF`, in
`GetChartered_app/assets/courses.ts`) — everything else is inferred from
standard ICAEW paper names. The result-entry form always shows this as an
editable dropdown rather than a hidden assumption, specifically because it
might be wrong — but it's worth Pierce cross-checking that file's table
against the real exam catalogue when convenient, independent of this
Lambda work.
