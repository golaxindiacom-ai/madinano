import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/admin/db";
import type { Activity, AdminDatabase, EmailOutboxItem, User } from "@/lib/admin/types";

const now = () => new Date().toISOString();

export type CreateActivityInput = {
  message: string;
  type: string;
  color?: string;
  userId?: string | null;
  audience?: Activity["audience"];
  href?: string;
};

const TYPE_COLORS: Record<string, string> = {
  contact: "bg-sky-500",
  payment: "bg-amber-500",
  subscription: "bg-violet-500",
  user: "bg-emerald-500",
  course: "bg-sky-500",
  enrollment: "bg-emerald-500",
  newsletter: "bg-teal-500",
  email: "bg-indigo-500",
  live: "bg-rose-500",
  instructor: "bg-fuchsia-500",
};

export function pushActivity(db: AdminDatabase, input: CreateActivityInput) {
  const activity: Activity = {
    id: randomUUID(),
    message: input.message,
    type: input.type,
    color: input.color || TYPE_COLORS[input.type] || "bg-primary",
    userId: input.userId ?? null,
    audience: input.audience || (input.userId ? "student" : "admin"),
    readBy: [],
    href: input.href,
    createdAt: now(),
    updatedAt: now(),
  };
  db.activities.unshift(activity);
  if (db.activities.length > 300) db.activities = db.activities.slice(0, 300);
  return activity;
}

export async function createActivity(input: CreateActivityInput) {
  const db = await readDb();
  const activity = pushActivity(db, input);
  await writeDb(db);
  return activity;
}

function canSee(activity: Activity, user: User) {
  if (user.role === "admin") return true;
  if (activity.userId && activity.userId === user.id) return true;
  if (activity.userId && activity.userId !== user.id) return false;
  const audience = activity.audience || "admin";
  if (audience === "all") return true;
  return audience === user.role;
}

export type NotificationItem = Activity & { read: boolean };

export async function listNotificationsForUser(userId: string, limit = 30) {
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.status !== "active") throw new Error("Not authenticated");

  const items = db.activities
    .filter((activity) => canSee(activity, user))
    .slice(0, limit)
    .map((activity) => ({
      ...activity,
      read: (activity.readBy ?? []).includes(userId),
    }));

  const unreadCount = items.filter((item) => !item.read).length;
  return { items, unreadCount };
}

export async function markNotificationsRead(userId: string, ids?: string[], all = false) {
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.status !== "active") throw new Error("Not authenticated");

  let changed = 0;
  for (const activity of db.activities) {
    if (!canSee(activity, user)) continue;
    if (!all && ids && !ids.includes(activity.id)) continue;
    if (!activity.readBy) activity.readBy = [];
    if (!activity.readBy.includes(userId)) {
      activity.readBy.push(userId);
      activity.updatedAt = now();
      changed += 1;
    }
  }
  if (changed) await writeDb(db);
  return { changed };
}

export async function listEmailOutbox(limit = 40) {
  const db = await readDb();
  return (db.emailOutbox ?? []).slice(0, limit);
}

export async function queueEmail(input: {
  to: string;
  subject: string;
  body: string;
  relatedType?: string;
}): Promise<EmailOutboxItem> {
  const db = await readDb();
  const item: EmailOutboxItem = {
    id: randomUUID(),
    to: input.to.trim(),
    subject: input.subject.trim(),
    body: input.body.trim(),
    status: "queued",
    relatedType: input.relatedType,
    createdAt: now(),
    updatedAt: now(),
  };
  if (!db.emailOutbox) db.emailOutbox = [];
  db.emailOutbox.unshift(item);

  // Deliver via console / optional Resend — always persist outcome in outbox
  try {
    const { deliverEmail } = await import("@/lib/mail/send-mail");
    await deliverEmail(item);
    item.status = "sent";
    item.updatedAt = now();
  } catch (error) {
    item.status = "failed";
    item.body = `${item.body}\n\n[Delivery error] ${error instanceof Error ? error.message : "failed"}`;
    item.updatedAt = now();
  }

  db.emailOutbox[0] = item;
  if (db.emailOutbox.length > 200) db.emailOutbox = db.emailOutbox.slice(0, 200);
  await writeDb(db);
  return item;
}
