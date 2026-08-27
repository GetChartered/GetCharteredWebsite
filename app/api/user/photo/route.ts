import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";
import { invalidateCachedProfile } from "@/lib/profileCache";

// POST /api/user/photo — same-origin proxy to the GC backend's POST
// /user/photo (see backend-reference/updateUserPhoto.js for the Lambda that
// endpoint will run — NOT YET DEPLOYED as of this writing). Body:
// { imageBase64: "data:image/jpeg;base64,..." }, produced client-side by
// components/account/AvatarUpload.tsx via lib/image/resizeImageToSquare.ts
// (already cropped/resized before it reaches here, so the payload stays
// small). Mirrors lib/practice/examPrepServer.ts's callGcApi/error-handling
// shape.
//
// Until the backend route exists, callGcApi's fetch will either throw
// (network-level failure) or come back with a non-OK status (API Gateway's
// "no route matched" response) — both are handled the same way below, as a
// clean 502 rather than a crash, so the client always gets something it can
// show the user instead of an unhandled exception.
export async function POST(request: Request) {
  const session = await requireOnboardedSession("/my-account");

  const body = (await request.json().catch(() => null)) as { imageBase64?: unknown } | null;
  const imageBase64 = body?.imageBase64;
  if (typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
    return NextResponse.json({ error: "Missing or invalid image" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await callGcApi("/user/photo", {
      method: "POST",
      body: JSON.stringify({ image: imageBase64 }),
    });
  } catch (error) {
    console.error("[POST /api/user/photo] callGcApi threw — backend route likely not deployed yet", error);
    return NextResponse.json(
      { error: "Photo upload isn't available yet — please try again later." },
      { status: 502 }
    );
  }

  const data = await response.json().catch(() => null);
  const photoUrl = (data as { photoUrl?: unknown } | null)?.photoUrl;

  if (!response.ok || typeof photoUrl !== "string" || !photoUrl) {
    console.error(
      "[POST /api/user/photo] backend returned a non-OK or unexpected response",
      response.status,
      data
    );
    return NextResponse.json(
      { error: "Photo upload isn't available yet — please try again later." },
      { status: 502 }
    );
  }

  // The next page load's GET /profile should reflect the new photo, not the
  // cached pre-upload snapshot — same invalidation app/api/onboarding/route.ts
  // does after completing onboarding.
  invalidateCachedProfile(session.user.sub);

  return NextResponse.json({ ok: true, photoUrl });
}
