import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Get the access password from environment variables
    const correctPassword = process.env.ACCESS_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { error: "Access password not configured" },
        { status: 500 }
      );
    }

    if (password === correctPassword) {
      // Create response with success
      const response = NextResponse.json({ success: true });

      // Set a secure cookie that expires in 7 days
      response.cookies.set("site-access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    } else {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
