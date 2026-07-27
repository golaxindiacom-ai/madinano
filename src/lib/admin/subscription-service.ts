import { randomUUID } from "crypto";
import { pushActivity, queueEmail } from "@/lib/notifications/notification-service";
import { readDb, writeDb } from "./db";
import type {
  AdminDatabase,
  Payment,
  SubscribeInput,
  SubscribeResult,
  Subscription,
  SubscriptionDetailPayload,
  SubscriptionInput,
  SubscriptionListItem,
  SubscriptionPlanInfo,
  SubscriptionStats,
  StudentSubscriptionItem,
} from "./types";

const now = () => new Date().toISOString();

export const SUBSCRIPTION_PLANS: Record<
  Subscription["plan"],
  { label: string; amount: number; durationDays: number | null; period: string; savings?: string; features: string[]; popular?: boolean }
> = {
  monthly: {
    label: "Monthly",
    amount: 499,
    durationDays: 30,
    period: "per month",
    features: ["All courses access", "Certificates", "Live classes", "Email support"],
  },
  yearly: {
    label: "Yearly",
    amount: 4999,
    durationDays: 365,
    period: "per year",
    savings: "Save 17%",
    popular: true,
    features: ["Everything in Monthly", "Priority support", "Downloadable resources", "1-on-1 mentor session"],
  },
  lifetime: {
    label: "Lifetime",
    amount: 14999,
    durationDays: null,
    period: "one-time",
    savings: "Best value",
    features: ["Forever access", "All future courses", "VIP community", "Career guidance"],
  },
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function lifetimeEndDate() {
  return new Date("2099-12-31T23:59:59.999Z");
}

function generateTransactionId() {
  return `TXN-SUB-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function normalizeSubscription(raw: Record<string, unknown>): Subscription {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    userId: raw.userId ? String(raw.userId) : undefined,
    studentName: String(raw.studentName ?? ""),
    studentEmail: raw.studentEmail ? String(raw.studentEmail) : undefined,
    plan: (raw.plan as Subscription["plan"]) ?? "monthly",
    amount: Number(raw.amount ?? 0),
    startDate: String(raw.startDate ?? ""),
    endDate: String(raw.endDate ?? ""),
    status: (raw.status as Subscription["status"]) ?? "active",
    autoRenew: Boolean(raw.autoRenew),
    paymentMethod: raw.paymentMethod as Payment["method"] | undefined,
    transactionId: raw.transactionId ? String(raw.transactionId) : undefined,
  };
}

function computeDaysRemaining(endDate: string) {
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

function isCurrentlyActive(sub: Subscription) {
  if (sub.status !== "active") return false;
  const end = new Date(sub.endDate);
  return !Number.isNaN(end.getTime()) && end.getTime() >= Date.now();
}

function enrichSubscription(sub: Subscription): SubscriptionListItem {
  const plan = SUBSCRIPTION_PLANS[sub.plan] ?? SUBSCRIPTION_PLANS.monthly;
  const daysRemaining = computeDaysRemaining(sub.endDate);
  return {
    ...sub,
    planLabel: plan.label,
    daysRemaining,
    isExpiringSoon: sub.status === "active" && daysRemaining > 0 && daysRemaining <= 7,
    isCurrentlyActive: isCurrentlyActive(sub),
  };
}

function syncExpiredSubscriptions(db: AdminDatabase) {
  const ts = now();
  for (let i = 0; i < db.subscriptions.length; i++) {
    const sub = normalizeSubscription(db.subscriptions[i] as unknown as Record<string, unknown>);
    if (sub.status === "active" && sub.plan !== "lifetime" && new Date(sub.endDate) < new Date()) {
      db.subscriptions[i] = { ...db.subscriptions[i], status: "expired", updatedAt: ts };
    }
  }
}

function addActivity(db: AdminDatabase, message: string, extras?: { userId?: string; audience?: "admin" | "student"; href?: string }) {
  pushActivity(db, {
    message,
    type: "subscription",
    userId: extras?.userId,
    audience: extras?.audience || "admin",
    href: extras?.href,
  });
}

function resolveEndDate(plan: Subscription["plan"], startDate: string, customEnd?: string) {
  if (customEnd) return new Date(customEnd).toISOString();
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid start date");
  const cfg = SUBSCRIPTION_PLANS[plan];
  if (cfg.durationDays == null) return lifetimeEndDate().toISOString();
  return addDays(start, cfg.durationDays).toISOString();
}

function validateInput(input: SubscriptionInput, db: AdminDatabase, selfId?: string): string | null {
  if (!input.studentName?.trim()) return "Student name is required";
  if (!input.startDate) return "Start date is required";
  if (!["monthly", "yearly", "lifetime"].includes(input.plan)) return "Invalid plan";
  if (!["active", "expired", "cancelled"].includes(input.status)) return "Invalid status";

  if (input.userId) {
    const user = db.users.find((u) => u.id === input.userId);
    if (!user) return "Student not found";
    if (user.role !== "student") return "Selected user must be a student";
  }

  if (selfId && !db.subscriptions.find((s) => s.id === selfId)) return "Subscription not found";
  return null;
}

export type ListSubscriptionsOptions = {
  search?: string;
  status?: Subscription["status"] | "all";
  plan?: Subscription["plan"] | "all";
  expiringSoon?: boolean;
};

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const db = await readDb();
  syncExpiredSubscriptions(db);
  const subs = db.subscriptions.map((s) =>
    enrichSubscription(normalizeSubscription(s as unknown as Record<string, unknown>)),
  );
  const active = subs.filter((s) => s.isCurrentlyActive);

  return {
    total: subs.length,
    active: active.length,
    expired: subs.filter((s) => s.status === "expired").length,
    cancelled: subs.filter((s) => s.status === "cancelled").length,
    expiringSoon: subs.filter((s) => s.isExpiringSoon).length,
    monthly: active.filter((s) => s.plan === "monthly").length,
    yearly: active.filter((s) => s.plan === "yearly").length,
    lifetime: active.filter((s) => s.plan === "lifetime").length,
    mrr: Math.round(
      active.reduce((sum, s) => {
        if (s.plan === "monthly") return sum + s.amount;
        if (s.plan === "yearly") return sum + s.amount / 12;
        return sum;
      }, 0),
    ),
    totalRevenue: subs.reduce((sum, s) => sum + s.amount, 0),
  };
}

export async function listSubscriptions(
  options: ListSubscriptionsOptions = {},
): Promise<SubscriptionListItem[]> {
  const db = await readDb();
  syncExpiredSubscriptions(db);

  let subs = db.subscriptions.map((s) =>
    enrichSubscription(normalizeSubscription(s as unknown as Record<string, unknown>)),
  );

  if (options.status && options.status !== "all") {
    subs = subs.filter((s) => s.status === options.status);
  }
  if (options.plan && options.plan !== "all") {
    subs = subs.filter((s) => s.plan === options.plan);
  }
  if (options.expiringSoon) {
    subs = subs.filter((s) => s.isExpiringSoon);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    subs = subs.filter((s) =>
      [s.studentName, s.studentEmail, s.planLabel, s.transactionId].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }

  return subs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetailPayload | null> {
  const db = await readDb();
  const raw = db.subscriptions.find((s) => s.id === id);
  if (!raw) return null;
  return {
    subscription: enrichSubscription(normalizeSubscription(raw as unknown as Record<string, unknown>)),
  };
}

export async function createSubscription(input: SubscriptionInput): Promise<SubscriptionListItem> {
  const db = await readDb();
  const err = validateInput(input, db);
  if (err) throw new Error(err);

  const user = input.userId ? db.users.find((u) => u.id === input.userId) : undefined;
  const planCfg = SUBSCRIPTION_PLANS[input.plan];
  const ts = now();
  const startDate = new Date(input.startDate).toISOString();

  const subscription: Subscription = {
    id: randomUUID(),
    userId: user?.id,
    studentName: user?.name ?? input.studentName.trim(),
    studentEmail: user?.email ?? input.studentEmail?.trim(),
    plan: input.plan,
    amount: input.amount != null ? Number(input.amount) : planCfg.amount,
    startDate,
    endDate: resolveEndDate(input.plan, startDate, input.endDate),
    status: input.status,
    autoRenew: Boolean(input.autoRenew),
    paymentMethod: input.paymentMethod,
    createdAt: ts,
    updatedAt: ts,
  };

  db.subscriptions.unshift(subscription);
  await writeDb(db);
  return enrichSubscription(subscription);
}

export async function updateSubscription(
  id: string,
  input: SubscriptionInput,
): Promise<SubscriptionListItem | null> {
  const db = await readDb();
  const err = validateInput(input, db, id);
  if (err) throw new Error(err);

  const idx = db.subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const existing = normalizeSubscription(db.subscriptions[idx] as unknown as Record<string, unknown>);
  const user = input.userId ? db.users.find((u) => u.id === input.userId) : undefined;
  const planCfg = SUBSCRIPTION_PLANS[input.plan];
  const startDate = new Date(input.startDate).toISOString();

  const updated: Subscription = {
    ...existing,
    userId: user?.id ?? existing.userId,
    studentName: user?.name ?? input.studentName.trim(),
    studentEmail: user?.email ?? input.studentEmail?.trim() ?? existing.studentEmail,
    plan: input.plan,
    amount: input.amount != null ? Number(input.amount) : planCfg.amount,
    startDate,
    endDate: resolveEndDate(input.plan, startDate, input.endDate),
    status: input.status,
    autoRenew: Boolean(input.autoRenew),
    paymentMethod: input.paymentMethod ?? existing.paymentMethod,
    updatedAt: now(),
  };

  db.subscriptions[idx] = updated;
  await writeDb(db);
  return enrichSubscription(updated);
}

export async function updateSubscriptionStatus(
  id: string,
  status: Subscription["status"],
): Promise<SubscriptionListItem | null> {
  const db = await readDb();
  const idx = db.subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  db.subscriptions[idx] = { ...db.subscriptions[idx], status, updatedAt: now() };
  await writeDb(db);
  return enrichSubscription(db.subscriptions[idx] as Subscription);
}

export async function renewSubscription(id: string): Promise<SubscriptionListItem | null> {
  const db = await readDb();
  const idx = db.subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const sub = normalizeSubscription(db.subscriptions[idx] as unknown as Record<string, unknown>);
  if (sub.plan === "lifetime") throw new Error("Lifetime subscriptions cannot be renewed");

  const start = new Date();
  const endDate = resolveEndDate(sub.plan, start.toISOString());
  db.subscriptions[idx] = {
    ...sub,
    startDate: start.toISOString(),
    endDate,
    status: "active",
    updatedAt: now(),
  };
  await writeDb(db);
  return enrichSubscription(db.subscriptions[idx] as Subscription);
}

export async function deleteSubscription(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.subscriptions.length;
  db.subscriptions = db.subscriptions.filter((s) => s.id !== id);
  if (db.subscriptions.length === before) return false;
  await writeDb(db);
  return true;
}

export async function listStudentsForSubscriptions() {
  const db = await readDb();
  return db.users
    .filter((u) => u.role === "student")
    .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listPublicPlans(): SubscriptionPlanInfo[] {
  return Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
    id: id as Subscription["plan"],
    label: plan.label,
    amount: plan.amount,
    period: plan.period,
    savings: plan.savings,
    features: plan.features,
    popular: plan.popular,
  }));
}

export async function getActiveSubscription(userId: string): Promise<SubscriptionListItem | null> {
  const db = await readDb();
  syncExpiredSubscriptions(db);
  const user = db.users.find((u) => u.id === userId);

  const sub = db.subscriptions
    .map((s) => enrichSubscription(normalizeSubscription(s as unknown as Record<string, unknown>)))
    .filter((s) => s.userId === userId || (user && s.studentEmail === user.email))
    .filter((s) => s.isCurrentlyActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return sub ?? null;
}

export async function subscribeStudent(input: SubscribeInput): Promise<SubscribeResult> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === input.userId);
  if (!user) throw new Error("Student not found");
  if (user.role !== "student") throw new Error("Only students can subscribe");

  const existing = await getActiveSubscription(input.userId);
  if (existing) throw new Error(`Already subscribed to ${existing.planLabel} plan`);

  const planCfg = SUBSCRIPTION_PLANS[input.plan];
  const ts = now();
  const startDate = ts;
  const endDate = resolveEndDate(input.plan, startDate);
  const transactionId = generateTransactionId();

  const subscription: Subscription = {
    id: randomUUID(),
    userId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    plan: input.plan,
    amount: planCfg.amount,
    startDate,
    endDate,
    status: "active",
    autoRenew: Boolean(input.autoRenew),
    paymentMethod: input.method,
    transactionId,
    createdAt: ts,
    updatedAt: ts,
  };

  const payment: Payment = {
    id: randomUUID(),
    orderId: `SUB-${subscription.id}`,
    orderNo: `SUB-${planCfg.label.toUpperCase()}-${Date.now()}`,
    userId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    courseTitle: `${planCfg.label} Premium Plan`,
    amount: planCfg.amount,
    method: input.method,
    status: "completed",
    transactionId,
    createdAt: ts,
    updatedAt: ts,
  };

  db.subscriptions.unshift(subscription);
  db.payments.unshift(payment);
  addActivity(db, `${user.name} subscribed to ${planCfg.label} plan (₹${planCfg.amount})`, {
    audience: "admin",
    href: "/admin/subscriptions",
  });
  addActivity(db, `Your ${planCfg.label} subscription is now active`, {
    userId: user.id,
    audience: "student",
    href: "/dashboard/subscription",
  });
  await writeDb(db);

  await queueEmail({
    to: user.email,
    subject: `${planCfg.label} subscription activated`,
    body: `Hi ${user.name},\n\nYour ${planCfg.label} Premium plan (₹${planCfg.amount}) is now active.\n\nManage it anytime from your dashboard.`,
    relatedType: "subscription",
  });

  return {
    subscription,
    payment,
    message: `Welcome to ${planCfg.label} Premium! Your subscription is now active.`,
  };
}

export async function listStudentSubscriptions(userId: string): Promise<StudentSubscriptionItem[]> {
  const db = await readDb();
  syncExpiredSubscriptions(db);
  const user = db.users.find((u) => u.id === userId);

  return db.subscriptions
    .map((s) => enrichSubscription(normalizeSubscription(s as unknown as Record<string, unknown>)))
    .filter((s) => s.userId === userId || (user && s.studentEmail === user.email))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s) => ({
      id: s.id,
      plan: s.plan,
      planLabel: s.planLabel,
      amount: s.amount,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      isCurrentlyActive: s.isCurrentlyActive,
      daysRemaining: s.daysRemaining,
      autoRenew: Boolean(s.autoRenew),
    }));
}

export async function cancelStudentSubscription(userId: string, subscriptionId: string) {
  const db = await readDb();
  const sub = db.subscriptions.find((s) => s.id === subscriptionId);
  if (!sub) throw new Error("Subscription not found");
  if (sub.userId && sub.userId !== userId) throw new Error("Not authorized");

  const idx = db.subscriptions.findIndex((s) => s.id === subscriptionId);
  db.subscriptions[idx] = {
    ...db.subscriptions[idx],
    status: "cancelled",
    autoRenew: false,
    updatedAt: now(),
  };
  await writeDb(db);
  return enrichSubscription(db.subscriptions[idx] as Subscription);
}
