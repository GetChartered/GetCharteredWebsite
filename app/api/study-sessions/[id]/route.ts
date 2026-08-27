import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";

// DELETE /api/study-sessions/[id] — same-origin proxy to the GC backend's
// DELETE /study-sessions/{id}.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireOnboardedSession("/planner");
  const { id } = await params;

  let response: Response;
  try {
    response = await callGcApi(`/study-sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("[DELETE /api/study-sessions/[id]] callGcApi threw", error);
    return NextResponse.json({ error: "Couldn't delete session" }, { status: 502 });
  }

  if (!response.ok) {
    console.error("[DELETE /api/study-sessions/[id]] backend returned non-OK", response.status);
    return NextResponse.json({ error: "Couldn't delete session" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
