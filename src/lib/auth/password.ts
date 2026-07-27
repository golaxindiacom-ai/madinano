import { createHash } from "crypto";

const SALT = "navbharat-gurukulam";

export function hashPassword(password: string) {
  return createHash("sha256").update(`${password}:${SALT}`).digest("hex");
}

export function verifyPassword(password: string, passwordHash?: string) {
  if (!passwordHash) return false;
  return hashPassword(password) === passwordHash;
}
