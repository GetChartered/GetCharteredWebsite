# backend-reference/

**Nothing in this folder is deployed.** It's a reference implementation
written for Pierce to review and deploy manually — this session has no AWS
console/CLI access. The website (`app/api/user/photo/route.ts`) already
handles the route below not existing yet: uploads fail with a clean inline
error + retry instead of a crash, and the account page just keeps showing
the user's initials or Auth0 picture until this is live.

## What's here

- `updateUserPhoto.js` — the Lambda handler for `POST /user/photo`. Full
  comment block at the top of the file covers the IAM permissions it needs
  and the public-bucket-vs-signed-URLs decision in detail — read that before
  deploying, not just this checklist.
- `package.json` — its dependencies (`@aws-sdk/client-dynamodb`,
  `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`).

## What Pierce needs to do to deploy this

1. **Create the S3 bucket** — suggested name `getchartered-user-photos`,
   region `eu-west-2` (same region the rest of this backend runs in, per
   `lib/gcApi.ts`'s Gateway URL). Decide public-read vs. signed URLs first
   (see the decision block in `updateUserPhoto.js`) — that decision affects
   the bucket's Block Public Access setting and whether a bucket policy is
   needed, so it's easier to get right at creation time than to retrofit.

2. **Confirm the `users` DynamoDB table's actual primary key attribute
   name.** `updateUserPhoto.js` assumes it's `userId` (per the task this was
   written against) but that hasn't been verified against the real table —
   check what `GET /profile`'s Lambda actually uses as its key and fix the
   `Key: { userId }` in `updateUserPhoto.js` if it's different (e.g.
   `userID`, matching the casing `recordAttemptLambda` uses on its own
   tables).

3. **Deploy the Lambda** — zip `updateUserPhoto.js` + its `node_modules`
   (`npm install` in this folder first) the same way
   `GetChartered_app/backend/recordAttemptLambda` was packaged. Set its
   environment variables:
   - `USERS_TABLE` — the real table name.
   - `PHOTO_BUCKET` — only needed if it's not literally
     `getchartered-user-photos`.

   Attach an execution role with the IAM permissions listed at the top of
   `updateUserPhoto.js` (S3 `PutObject` on the new bucket, DynamoDB
   `UpdateItem` on the users table, plus the standard CloudWatch Logs
   basic-execution permissions).

4. **Add the API Gateway route** — `POST /user/photo` on the same HTTP API
   this backend already exposes (`https://mqtt2y9shf.execute-api.eu-west-2.amazonaws.com`),
   with the **same JWT authorizer** attached as every other authenticated
   route (`/exam-prep`, `/profile`, `/analytics/attempt`, etc.) — that's what
   makes `event.requestContext.authorizer.jwt.claims.sub` available in the
   handler.

5. **If public-read was chosen in step 1**, add the bucket policy granting
   `s3:GetObject` to `*` on `getchartered-user-photos/*` now, since the
   Lambda's returned URL assumes the object is actually readable. If
   signed URLs were chosen instead, see the code-shape change described in
   `updateUserPhoto.js`'s decision block — the Lambda as written doesn't
   implement that path.

6. **Test end-to-end** from the live site — the frontend is already wired up
   (`components/account/AvatarUpload.tsx` → `app/api/user/photo/route.ts` →
   this Lambda) and needs no further changes once the route above returns
   `{ ok: true, photoUrl }` for a real request.
