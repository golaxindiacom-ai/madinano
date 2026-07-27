import { NextResponse } from "next/server";
import { jsonError } from "@/lib/admin/api-utils";
import { signupStudent } from "@/lib/auth/auth-service";
import { sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await signupStudent({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      phone: body.phone ? String(body.phone) : undefined,
    });
    const response = NextResponse.json({ success: true, data: result.user });
    response.cookies.set(sessionCookieOptions(result.token));
    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Signup failed", 400);
  }
}
