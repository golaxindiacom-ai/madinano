import { createHmac } from "crypto";
import {
  SESSION_COOKIE,
  signSessionToken,
  verifySessionTokenAsync,
} from "./session-edge";

export { SESSION_COOKIE, signSessionToken, verifySessionTokenAsync };

const SESSION_SECRET = process.env.AUTH_SECRET || "madinano-dev-secret-change-in-production";

/** Sync verify for Node API routes. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");

  if (parts.length === 2) {
    const [userId, sig] = parts;
    const expected = createHmac("sha256", SESSION_SECRET).update(userId).digest("hex").slice(0, 32);
    return sig === expected ? userId : null;
  }

  if (parts.length === 3) {
    const [userId, role, sig] = parts;
    const expected = createHmac("sha256", SESSION_SECRET)
      .update(`${userId}.${role}`)
      .digest("hex")
      .slice(0, 32);
    return sig === expected ? userId : null;
  }

  return null;
}

export function getSessionUserIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;
  return verifySessionToken(decodeURIComponent(match[1]));
}

export function getSessionRoleFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;
  const token = decodeURIComponent(match[1]);
  const parts = token.split(".");
  if (parts.length === 3 && verifySessionToken(token)) return parts[1];
  return null;
}

export async function getSessionUserIdFromCookies(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
