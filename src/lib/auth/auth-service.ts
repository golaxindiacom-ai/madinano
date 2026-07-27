import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/admin/db";
import type { User } from "@/lib/admin/types";
import { hashPassword, verifyPassword } from "./password";
import { signSessionToken } from "./session";

const now = () => new Date().toISOString();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  phone?: string;
  country?: string;
  city?: string;
};

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    country: user.country,
    city: user.city,
  };
}

export async function signupStudent(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  if (!input.name?.trim()) throw new Error("Name is required");
  if (!input.email?.trim()) throw new Error("Email is required");
  if (!input.password || input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const db = await readDb();
  const email = normalizeEmail(input.email);
  if (db.users.some((u) => normalizeEmail(u.email) === email)) {
    throw new Error("An account with this email already exists");
  }

  const ts = now();
  const user: User = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    role: "student",
    status: "active",
    phone: input.phone?.trim() || undefined,
    passwordHash: hashPassword(input.password),
    createdAt: ts,
    updatedAt: ts,
  };

  db.users.unshift(user);
  await writeDb(db);

  return {
    user: toAuthUser(user),
    token: await signSessionToken(user.id, user.role),
  };
}

export async function loginUser(email: string, password: string) {
  if (!email?.trim() || !password) throw new Error("Email and password are required");

  const db = await readDb();
  const normalized = normalizeEmail(email);
  const user = db.users.find((u) => normalizeEmail(u.email) === normalized);
  if (!user) throw new Error("Invalid email or password");
  if (user.status !== "active") throw new Error("Your account is not active. Contact support.");
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], lastLoginAt: now(), updatedAt: now() };
    await writeDb(db);
  }

  return {
    user: toAuthUser(user),
    token: await signSessionToken(user.id, user.role),
  };
}

export async function getAuthUser(userId: string): Promise<AuthUser | null> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.status !== "active") return null;
  return toAuthUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (!currentPassword) throw new Error("Current password is required");
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }
  if (currentPassword === newPassword) {
    throw new Error("New password must be different from the current password");
  }

  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Account not found");

  const user = db.users[idx];
  if (user.status !== "active") throw new Error("Your account is not active. Contact support.");
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new Error("Current password is incorrect");
  }

  db.users[idx] = {
    ...user,
    passwordHash: hashPassword(newPassword),
    updatedAt: now(),
  };
  await writeDb(db);

  return { ok: true as const };
}
