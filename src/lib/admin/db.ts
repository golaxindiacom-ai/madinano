import { mergeAppSettings } from "@/lib/certificate-settings";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { prismaRowsToAdminDatabase, syncAdminDatabaseToPrisma } from "./db-prisma-mapper";
import { migrateOrdersAndPayments } from "./migrate-orders";
import { createSeedDatabase } from "./seed";
import type { AdminDatabase, AppSettings, CollectionKey } from "./types";

let writeQueue: Promise<void> = Promise.resolve();

async function loadFromPrisma(): Promise<AdminDatabase> {
  const [
    users,
    instructors,
    enrollments,
    categories,
    courses,
    lessons,
    assignments,
    assignmentSubmissions,
    quizzes,
    quizAttempts,
    certificates,
    liveClasses,
    payments,
    orders,
    subscriptions,
    coupons,
    blogs,
    events,
    testimonials,
    gallery,
    cmsPages,
    faq,
    roles,
    systemLogs,
    activities,
    newsletterSubscribers,
    emailOutbox,
    appSetting,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.instructor.findMany(),
    prisma.enrollment.findMany(),
    prisma.category.findMany(),
    prisma.course.findMany(),
    prisma.lesson.findMany(),
    prisma.assignment.findMany(),
    prisma.assignmentSubmission.findMany(),
    prisma.quiz.findMany(),
    prisma.quizAttempt.findMany(),
    prisma.certificate.findMany(),
    prisma.liveClass.findMany(),
    prisma.payment.findMany(),
    prisma.order.findMany(),
    prisma.subscription.findMany(),
    prisma.coupon.findMany(),
    prisma.blog.findMany(),
    prisma.event.findMany(),
    prisma.testimonial.findMany(),
    prisma.galleryItem.findMany(),
    prisma.cmsPage.findMany(),
    prisma.faqItem.findMany(),
    prisma.role.findMany(),
    prisma.systemLog.findMany(),
    prisma.activity.findMany(),
    prisma.newsletterSubscriber.findMany(),
    prisma.emailOutboxItem.findMany(),
    prisma.appSetting.findUnique({ where: { id: "default" } }),
  ]);

  const seed = createSeedDatabase();
  const settings = mergeAppSettings(
    (appSetting?.settings as AppSettings | undefined) ?? seed.settings,
  );

  return prismaRowsToAdminDatabase({
    users,
    instructors,
    enrollments,
    categories,
    courses,
    lessons,
    assignments,
    assignmentSubmissions,
    quizzes,
    quizAttempts,
    certificates,
    liveClasses,
    payments,
    orders,
    subscriptions,
    coupons,
    blogs,
    events,
    testimonials,
    gallery,
    cmsPages,
    faq,
    roles,
    systemLogs,
    activities,
    newsletterSubscribers,
    emailOutbox,
    settings,
  });
}

function migrateDb(db: AdminDatabase): { db: AdminDatabase; authDirty: boolean } {
  if (!db.quizAttempts) db.quizAttempts = [];
  if (!db.enrollments) db.enrollments = [];
  if (!db.assignmentSubmissions) db.assignmentSubmissions = [];
  let structureDirty = false;
  if (!db.newsletterSubscribers) {
    db.newsletterSubscribers = [];
    structureDirty = true;
  }
  if (!db.emailOutbox) {
    db.emailOutbox = [];
    structureDirty = true;
  }
  if (!db.activities) {
    db.activities = [];
    structureDirty = true;
  }
  delete (db as { questionBank?: unknown }).questionBank;

  let authDirty = false;
  for (const user of db.users) {
    if (!user.passwordHash) {
      user.passwordHash = hashPassword("password123");
      authDirty = true;
    }
  }

  for (const activity of db.activities) {
    if (!activity.audience) {
      activity.audience = "admin";
      structureDirty = true;
    }
    if (!activity.readBy) {
      activity.readBy = [];
      structureDirty = true;
    }
  }

  return { db, authDirty: authDirty || structureDirty };
}

async function ensureDb(): Promise<AdminDatabase> {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const seed = createSeedDatabase();
    seed.settings = mergeAppSettings(seed.settings);
    await writeDb(seed);
    return seed;
  }

  let db = await loadFromPrisma();
  const { db: migrated, authDirty } = migrateDb(db);
  db = migrated;
  const ordersDirty = migrateOrdersAndPayments(db);
  db.settings = mergeAppSettings(db.settings);

  if (ordersDirty || authDirty) {
    await writeDb(db);
  }

  return db;
}

export async function readDb(): Promise<AdminDatabase> {
  return ensureDb();
}

export async function writeDb(data: AdminDatabase): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    data.settings = mergeAppSettings(data.settings);
    await prisma.$transaction(async (tx) => {
      await syncAdminDatabaseToPrisma(data, tx);
    });
  });
  await writeQueue;
}

export async function getCollection<K extends CollectionKey>(key: K): Promise<AdminDatabase[K]> {
  const db = await readDb();
  return db[key];
}

export async function setCollection<K extends CollectionKey>(
  key: K,
  value: AdminDatabase[K],
): Promise<AdminDatabase[K]> {
  const db = await readDb();
  db[key] = value;
  await writeDb(db);
  return value;
}

export async function getSettings(): Promise<AdminDatabase["settings"]> {
  const db = await readDb();
  return mergeAppSettings(db.settings);
}

export async function updateSettings(settings: AdminDatabase["settings"]): Promise<AdminDatabase["settings"]> {
  const db = await readDb();
  db.settings = mergeAppSettings(settings);
  await writeDb(db);
  return db.settings;
}

export async function exportDb(): Promise<AdminDatabase> {
  return readDb();
}

export async function importDb(data: AdminDatabase): Promise<AdminDatabase> {
  await writeDb(data);
  return data;
}

export function getDbPath() {
  return process.env.DATABASE_URL ?? "postgresql://localhost:5432/navbharat";
}
