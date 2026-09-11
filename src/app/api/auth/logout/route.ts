import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set("hms_auth_token", "", {
    maxAge: 0,
    path: "/",
  });
  return response;
}
