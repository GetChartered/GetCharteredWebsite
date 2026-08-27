// backend-reference/updateUserPhoto.js
//
// *** NOT DEPLOYED. ***  This is a reference implementation only, written by
// Claude for Pierce to review, adjust, and deploy manually to AWS — this
// session has no AWS deploy access. Nothing on the live site depends on this
// file existing; app/api/user/photo/route.ts (the Next.js side) already
// handles the case where the route below doesn't exist yet (a clean 502 to
// the browser instead of a crash), and app/my-account itself degrades to
// showing the user's initials/Auth0 picture until this is deployed.
//
// Purpose -> POST /user/photo
// Accepts a small base64-encoded image from an authenticated user, uploads
// it to S3, and records the resulting URL on that user's row in DynamoDB.
//
// Modelled directly on GetChartered_app/backend/recordAttemptLambda/index.js
// — same JWT-claims-from-authorizer pattern, same statusCode/body response
// shape, same top-level try/catch -> 500. The one deliberate difference:
// this accepts a base64 JSON body (matching every other route this backend
// already exposes — see GetChartered_website/lib/gcApi.ts's callers, all of
// which send/receive JSON) rather than multipart/form-data, so it doesn't
// need a different content-type / API Gateway payload configuration from
// every other route. The client (components/account/AvatarUpload.tsx) has
// already cropped the image to a small square before this ever runs, so the
// base64 payload is small — this Lambda still defends against an oversized
// body itself (MAX_IMAGE_BYTES below), since it can't trust the client.
//
// ============================================================================
// IAM PERMISSIONS THIS LAMBDA'S EXECUTION ROLE WILL NEED
// ============================================================================
//   - s3:PutObject   on arn:aws:s3:::getchartered-user-photos/*
//   - dynamodb:UpdateItem   on the users table's ARN (whatever table GET
//     /profile already reads from — see GetChartered_website/lib/profile.ts;
//     this Lambda assumes its primary key attribute is named `userId`,
//     matching the task spec this was written against, but that has NOT
//     been verified against the real table's actual key schema — confirm
//     before deploying, and adjust the Key below if it's actually `userID`
//     or something else).
//   - The usual CloudWatch Logs basic-execution permissions (logs:CreateLogGroup/
//     CreateLogStream/PutLogEvents) every Lambda needs, same as
//     recordAttemptLambda.
//
// ============================================================================
// DECISION PIERCE NEEDS TO MAKE: public bucket vs. signed URLs
// ============================================================================
// This implementation uploads privately (no ACL set on the PutObject call —
// deliberately: most buckets created since ~2023 default to "Bucket owner
// enforced" Object Ownership, which *rejects* PutObject calls that try to
// set an ACL at all, so setting one here would likely break uploads outright
// rather than make them public) and returns a plain
// `https://<bucket>.s3.<region>.amazonaws.com/<key>` URL, matching the
// literal "returns the photo URL" / "photoUrl field pointing to the S3
// object" ask. That URL will 403 until the bucket is made readable somehow —
// two real options, and this is Pierce's call, not something to default
// silently:
//
//   1. PUBLIC (simpler): add a bucket policy granting `s3:GetObject` to `*`
//      for `arn:aws:s3:::getchartered-user-photos/*`, and turn off "Block
//      Public Access" for the bucket. The URL this Lambda already returns
//      works as-is, forever, with no further backend changes. Downside:
//      avatar photos are then guessable/enumerable by anyone who has (or
//      brute-forces) an object key — fine for a lot of products, but it's a
//      real privacy tradeoff for headshots specifically.
//
//   2. SIGNED URLS (recommended for privacy): keep the bucket private, and
//      change this Lambda to store the S3 *key* in DynamoDB instead of a
//      URL (an `@aws-sdk/s3-request-presigner` signed URL expires — e.g. 7
//      days — so it can't be the thing saved permanently on the user's
//      profile). Whatever reads the photo back (GET /profile, or a new GET
//      /user/photo) would then need to call `getSignedUrl()` fresh on every
//      read and return *that* to the client instead of a stored URL. That's
//      a small but real shape change from what's implemented below — not
//      done here to avoid building and shipping an unused code path, but
//      flagged clearly so it's a conscious choice rather than a default.
//
// Whichever option is picked, GetChartered_website's GET /profile parsing
// (lib/profile.ts's parseProfileData) just reads whatever string is in
// `photoUrl` — it doesn't care whether that string is a permanent public URL
// or a freshly-signed one, so no website-side change is needed either way.

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({});

const USERS_TABLE = process.env.USERS_TABLE;
const PHOTO_BUCKET = process.env.PHOTO_BUCKET || "getchartered-user-photos";
const REGION = process.env.AWS_REGION || "eu-west-2";

// Resized client-side to ~320x320 JPEG before it ever reaches here (see
// lib/image/resizeImageToSquare.ts), so a real upload should be tens of KB,
// not megabytes — this cap is a defensive backstop against a client that
// skips that step (a modified request, not the real website), not a limit
// anyone should ever legitimately hit.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB

const MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Parses a "data:image/jpeg;base64,AAAA..." string into its mime type and
 *  raw base64 payload. Returns null if it doesn't look like a supported
 *  image data URL. */
function parseImageDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

exports.handler = async (event) => {
  try {
    const claims =
      event.requestContext &&
      event.requestContext.authorizer &&
      event.requestContext.authorizer.jwt &&
      event.requestContext.authorizer.jwt.claims;

    const userId = claims && typeof claims.sub === "string" ? claims.sub : null;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "UNAUTHENTICATED" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    const parsed = typeof payload.image === "string" ? parseImageDataUrl(payload.image) : null;
    if (!parsed) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid 'image' — expected a data:image/(jpeg|png|webp);base64,... string" }),
      };
    }

    const imageBuffer = Buffer.from(parsed.base64, "base64");
    if (imageBuffer.length === 0 || imageBuffer.length > MAX_IMAGE_BYTES) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Image is empty or too large" }),
      };
    }

    const extension = MIME_TO_EXTENSION[parsed.mimeType] || "jpg";
    // Timestamped rather than a fixed filename so a failed/slow DynamoDB
    // write after a successful S3 upload can't leave the two out of sync
    // with an old cached CDN/browser copy at the same URL — every upload is
    // a genuinely new object.
    const objectKey = `${userId}/avatar-${Date.now()}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: PHOTO_BUCKET,
        Key: objectKey,
        Body: imageBuffer,
        ContentType: parsed.mimeType,
        // No ACL here — see the "public bucket vs. signed URLs" comment at
        // the top of this file before deploying.
      })
    );

    const photoUrl = `https://${PHOTO_BUCKET}.s3.${REGION}.amazonaws.com/${objectKey}`;

    await ddb.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        // Assumes the users table's primary key attribute is named `userId`
        // — see the IAM/decisions comment block at the top of this file.
        Key: { userId },
        UpdateExpression: "SET photoUrl = :photoUrl, photoUpdatedAt = :ts",
        ExpressionAttributeValues: {
          ":photoUrl": photoUrl,
          ":ts": new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, photoUrl }),
    };
  } catch (err) {
    console.error("updateUserPhoto unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "INTERNAL_ERROR" }),
    };
  }
};
