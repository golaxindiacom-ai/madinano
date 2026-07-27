import { NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { loginUser } from "@/lib/auth/auth-service";
import { sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginUser(String(body.email ?? ""), String(body.password ?? ""));
    const response = NextResponse.json({ success: true, data: result.user });
    response.cookies.set(sessionCookieOptions(result.token));
    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Login failed", 401);
  }
}
