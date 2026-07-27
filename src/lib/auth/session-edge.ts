export const SESSION_COOKIE = "nbg_session";
const SESSION_SECRET = process.env.AUTH_SECRET || "navbharat-dev-secret-change-in-production";

async function hmacHex(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export async function signSessionToken(userId: string, role = "student") {
  const payload = `${userId}.${role}`;
  const sig = await hmacHex(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionTokenAsync(
  token: string | undefined | null,
): Promise<{ userId: string; role: string } | null> {
  if (!token) return null;
  const parts = token.split(".");

  if (parts.length === 2) {
    const [userId, sig] = parts;
    const expected = await hmacHex(userId);
    if (!userId || sig !== expected) return null;
    return { userId, role: "student" };
  }

  if (parts.length !== 3) return null;
  const [userId, role, sig] = parts;
  if (!userId || !role || !sig) return null;
  const expected = await hmacHex(`${userId}.${role}`);
  if (sig !== expected) return null;
  return { userId, role };
}
