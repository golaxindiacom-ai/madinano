import { promises as fs } from "fs";
import path from "path";
import { mergeAppSettings } from "@/lib/certificate-settings";
import { hashPassword } from "@/lib/auth/password";
import { migrateOrdersAndPayments } from "./migrate-orders";
import { createSeedDatabase } from "./seed";
import type { AdminDatabase, CollectionKey } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "admin-db.json");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDb(): Promise<AdminDatabase> {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as AdminDatabase;
    const { db, authDirty } = migrateDb(parsed);
    const ordersDirty = migrateOrdersAndPayments(db);
    db.settings = mergeAppSettings(db.settings);
    if (ordersDirty || authDirty) {
      await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    }
    return db;
  } catch {
    const seed = createSeedDatabase();
    seed.settings = mergeAppSettings(seed.settings);
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
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

export async function readDb(): Promise<AdminDatabase> {
  return ensureDb();
}

export async function writeDb(data: AdminDatabase): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
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
  return DB_PATH;
}
