import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import type { AdminDatabase, CollectionKey } from "./types";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export const COLLECTION_KEYS: CollectionKey[] = [
  "users",
  "instructors",
  "enrollments",
  "categories",
  "courses",
  "lessons",
  "assignments",
  "assignmentSubmissions",
  "quizzes",
  "quizAttempts",
  "certificates",
  "liveClasses",
  "payments",
  "orders",
  "subscriptions",
  "coupons",
  "blogs",
  "events",
  "testimonials",
  "gallery",
  "cmsPages",
  "faq",
  "roles",
  "systemLogs",
  "activities",
  "newsletterSubscribers",
  "emailOutbox",
];

export function isValidCollection(key: string): key is CollectionKey {
  return COLLECTION_KEYS.includes(key as CollectionKey);
}

export async function listItems(key: CollectionKey, search?: string) {
  const db = await readDb();
  let items = db[key] as Record<string, unknown>[];
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((item) =>
      Object.values(item).some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }
  return items;
}

export async function getItem(key: CollectionKey, id: string) {
  const db = await readDb();
  const items = db[key] as { id: string }[];
  return items.find((i) => i.id === id) ?? null;
}

export async function createItem(key: CollectionKey, body: Record<string, unknown>) {
  const db = await readDb();
  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...body,
  };
  (db[key] as unknown[]).unshift(item);
  await writeDb(db);
  await logAction("create", key, String(item.id));
  return item;
}

export async function updateItem(key: CollectionKey, id: string, body: Record<string, unknown>) {
  const db = await readDb();
  const items = db[key] as { id: string; updatedAt: string }[];
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...body, id, updatedAt: new Date().toISOString() };
  await writeDb(db);
  await logAction("update", key, id);
  return items[idx];
}

export async function deleteItem(key: CollectionKey, id: string) {
  const db = await readDb();
  const items = db[key] as { id: string }[];
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  await writeDb(db);
  await logAction("delete", key, id);
  return true;
}

async function logAction(action: string, module: string, targetId: string) {
  const db = await readDb();
  const now = new Date().toISOString();
  db.systemLogs.unshift({
    id: randomUUID(),
    action: `${action} ${module} (${targetId})`,
    user: "admin@madinano.com",
    module,
    ip: "127.0.0.1",
    level: "info",
    createdAt: now,
    updatedAt: now,
  });
  if (db.systemLogs.length > 200) db.systemLogs = db.systemLogs.slice(0, 200);
  await writeDb(db);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      key: monthKey(date),
      label: date.toLocaleString("en-US", { month: "short" }),
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });
}

function inMonth(iso: string | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const value = new Date(iso).getTime();
  return value >= start.getTime() && value <= end.getTime();
}

function isSubscriptionPayment(payment: {
  courseId?: string;
  orderId?: string;
  courseTitle?: string;
}) {
  if (payment.courseId) return false;
  if (payment.orderId?.toUpperCase().startsWith("SUB")) return true;
  return /plan|subscription|premium/i.test(payment.courseTitle || "");
}

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export async function getDashboardStats() {
  const db = await readDb();
  const students = db.users.filter((u) => u.role === "student");
  const completedPayments = db.payments.filter((p) => p.status === "completed");
  const totalEnrollments = db.enrollments.length;
  const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const months = lastNMonths(6);

  const analytics = months.map((month) => ({
    month: month.label,
    students: students.filter((student) => inMonth(student.createdAt, month.start, month.end)).length,
    enrollments: db.enrollments.filter((enrollment) =>
      inMonth(enrollment.enrolledAt, month.start, month.end),
    ).length,
    revenue: completedPayments
      .filter((payment) => inMonth(payment.createdAt, month.start, month.end))
      .reduce((sum, payment) => sum + payment.amount, 0),
  }));

  const sparklines = {
    students: months.map((month) => ({
      v: students.filter((student) => new Date(student.createdAt).getTime() <= month.end.getTime()).length,
    })),
    instructors: months.map((month) => ({
      v: db.instructors.filter((instructor) => new Date(instructor.createdAt).getTime() <= month.end.getTime())
        .length,
    })),
    courses: months.map((month) => ({
      v: db.courses.filter((course) => new Date(course.createdAt).getTime() <= month.end.getTime()).length,
    })),
    enrollments: months.map((month) => ({
      v: db.enrollments.filter((enrollment) => inMonth(enrollment.enrolledAt, month.start, month.end)).length,
    })),
    revenue: months.map((month) => ({
      v: completedPayments
        .filter((payment) => inMonth(payment.createdAt, month.start, month.end))
        .reduce((sum, payment) => sum + payment.amount, 0),
    })),
    orders: months.map((month) => ({
      v: db.orders.filter((order) => inMonth(order.createdAt, month.start, month.end)).length,
    })),
  };

  const courseSales = completedPayments
    .filter((payment) => Boolean(payment.courseId))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const subscriptionSales = completedPayments
    .filter((payment) => isSubscriptionPayment(payment))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const otherSales = Math.max(0, totalRevenue - courseSales - subscriptionSales);

  const revenueParts = [
    { name: "Course Sales", amount: courseSales, color: "#7b1e2b" },
    { name: "Subscriptions", amount: subscriptionSales, color: "#c79a3a" },
    { name: "Other", amount: otherSales, color: "#2f5233" },
  ].filter((part) => part.amount > 0);

  const revenueBreakdown = (revenueParts.length
    ? revenueParts
    : [{ name: "No revenue yet", amount: 0, color: "#d4d4d8" }]
  ).map((part) => ({
    ...part,
    value: totalRevenue > 0 ? pct(part.amount, totalRevenue) : part.amount === 0 ? 100 : 0,
  }));

  const completedCount = db.enrollments.filter((e) => e.status === "completed").length;
  const inProgressCount = db.enrollments.filter((e) => e.status === "active" && e.progress > 0).length;
  const notStartedCount = db.enrollments.filter((e) => e.status === "active" && e.progress <= 0).length;
  const droppedCount = db.enrollments.filter((e) => e.status === "dropped").length;

  const enrollmentParts = [
    { name: "Completed", count: completedCount, color: "#7b1e2b" },
    { name: "In Progress", count: inProgressCount, color: "#c79a3a" },
    { name: "Not Started", count: notStartedCount, color: "#2f5233" },
    { name: "Dropped", count: droppedCount, color: "#a84a56" },
  ].filter((part) => part.count > 0);

  const enrollmentBreakdown = (enrollmentParts.length
    ? enrollmentParts
    : [{ name: "No enrollments", count: 0, color: "#d4d4d8" }]
  ).map((part) => ({
    ...part,
    value: totalEnrollments > 0 ? pct(part.count, totalEnrollments) : part.count === 0 ? 100 : 0,
  }));

  const countryCounts = new Map<string, number>();
  for (const student of students) {
    const country = student.country?.trim() || "Unknown";
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
  }
  const countryColors = ["#7b1e2b", "#c79a3a", "#2f5233", "#a84a56", "#8a6d3b", "#4b5563"];
  const countries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], index) => ({
      name,
      count,
      pct: pct(count, students.length),
      color: countryColors[index % countryColors.length],
    }));

  const enrollmentByCourse = new Map<string, number>();
  for (const enrollment of db.enrollments) {
    enrollmentByCourse.set(
      enrollment.courseId,
      (enrollmentByCourse.get(enrollment.courseId) || 0) + 1,
    );
  }

  const popularCourses = db.courses
    .map((course) => ({
      title: course.title,
      enrollments: enrollmentByCourse.get(course.id) || 0,
      rating: course.rating,
    }))
    .sort((a, b) => b.enrollments - a.enrollments || b.rating - a.rating)
    .slice(0, 5);

  const periodStart = months[0]?.label ?? "";
  const periodEnd = months[months.length - 1]?.label ?? "";

  return {
    totalStudents: students.length,
    totalInstructors: db.instructors.length,
    totalCourses: db.courses.length,
    totalEnrollments,
    totalRevenue,
    totalOrders: db.orders.length,
    periodLabel: `${periodStart} – ${periodEnd}`,
    analytics,
    sparklines,
    revenueBreakdown,
    enrollmentBreakdown,
    countries,
    popularCourses,
    recentActivities: db.activities.slice(0, 8),
  };
}

export type { AdminDatabase };
