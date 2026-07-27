import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import { recomputeInstructorStats } from "./instructor-service";
import { hashPassword } from "@/lib/auth/password";
import type {
  Enrollment,
  Instructor,
  User,
  UserDetailPayload,
  UserInput,
  UserStats,
} from "./types";

const now = () => new Date().toISOString();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateInput(input: UserInput): string | null {
  if (!input.name?.trim()) return "Name is required";
  if (!input.email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Invalid email address";
  if (!["student", "instructor", "admin"].includes(input.role)) return "Invalid role";
  if (!["active", "inactive", "suspended"].includes(input.status)) return "Invalid status";
  return null;
}

async function syncInstructorProfile(user: User, db: Awaited<ReturnType<typeof readDb>>, ts: string) {
  if (user.role !== "instructor") {
    if (user.instructorId) {
      const idx = db.instructors.findIndex((i) => i.id === user.instructorId);
      if (idx !== -1) {
        db.users[db.users.findIndex((u) => u.id === user.id)] = {
          ...user,
          instructorId: undefined,
          updatedAt: ts,
        };
      }
    }
    return;
  }

  const existingByUser = db.instructors.find((i) => i.userId === user.id || i.email === user.email);
  if (existingByUser) {
    const idx = db.instructors.findIndex((i) => i.id === existingByUser.id);
    db.instructors[idx] = {
      ...existingByUser,
      name: user.name,
      email: user.email,
      userId: user.id,
      status: user.status === "active" ? "active" : user.status === "suspended" ? "inactive" : "pending",
      updatedAt: ts,
    };
    const uIdx = db.users.findIndex((u) => u.id === user.id);
    if (uIdx !== -1) db.users[uIdx] = { ...db.users[uIdx], instructorId: existingByUser.id, updatedAt: ts };
    return;
  }

  const instructor: Instructor = {
    id: randomUUID(),
    name: user.name,
    email: user.email,
    expertise: "General",
    courses: 0,
    students: 0,
    rating: 0,
    status: user.status === "active" ? "active" : "pending",
    userId: user.id,
    createdAt: ts,
    updatedAt: ts,
  };
  db.instructors.unshift(instructor);
  const uIdx = db.users.findIndex((u) => u.id === user.id);
  if (uIdx !== -1) db.users[uIdx] = { ...db.users[uIdx], instructorId: instructor.id, updatedAt: ts };
}

function recomputeInstructorStatsLocal(db: Awaited<ReturnType<typeof readDb>>) {
  recomputeInstructorStats(db);
}

export async function getUserStats(): Promise<UserStats> {
  const db = await readDb();
  const users = db.users ?? [];
  return {
    total: users.length,
    students: users.filter((u) => u.role === "student").length,
    instructors: users.filter((u) => u.role === "instructor").length,
    admins: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };
}

export type ListUsersOptions = {
  search?: string;
  role?: User["role"] | "all";
  status?: User["status"] | "all";
};

export async function listUsers(options: ListUsersOptions = {}): Promise<User[]> {
  const db = await readDb();
  let items = [...(db.users ?? [])];

  if (options.role && options.role !== "all") {
    items = items.filter((u) => u.role === options.role);
  }
  if (options.status && options.status !== "all") {
    items = items.filter((u) => u.status === options.status);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    items = items.filter((u) =>
      [u.name, u.email, u.phone, u.country, u.city, u.notes].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }

  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getUserDetail(id: string): Promise<UserDetailPayload | null> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;

  return {
    user,
    enrollments: (db.enrollments ?? []).filter((e) => e.userId === id),
    certificates: db.certificates.filter((c) => c.studentId === id),
    attempts: db.quizAttempts.filter((a) => a.studentId === id),
    orders: db.orders.filter((o) => o.studentName === user.name || o.studentName === user.email),
  };
}

export async function createUser(input: UserInput): Promise<User> {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const db = await readDb();
  const email = normalizeEmail(input.email);
  if (db.users.some((u) => normalizeEmail(u.email) === email)) {
    throw new Error("A user with this email already exists");
  }

  const ts = now();
  const user: User = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    status: input.status,
    phone: input.phone?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    passwordHash: hashPassword("password123"),
    createdAt: ts,
    updatedAt: ts,
  };

  db.users.unshift(user);
  if (user.role === "instructor") await syncInstructorProfile(user, db, ts);
  await writeDb(db);
  return db.users.find((u) => u.id === user.id) ?? user;
}

export async function updateUser(id: string, input: UserInput): Promise<User | null> {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  const email = normalizeEmail(input.email);
  if (db.users.some((u) => u.id !== id && normalizeEmail(u.email) === email)) {
    throw new Error("A user with this email already exists");
  }

  const ts = now();
  const user: User = {
    ...db.users[idx],
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    status: input.status,
    phone: input.phone?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    updatedAt: ts,
  };

  db.users[idx] = user;
  if (user.role === "instructor") await syncInstructorProfile(user, db, ts);
  await writeDb(db);
  return db.users.find((u) => u.id === id) ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;

  if (user.role === "admin" && db.users.filter((u) => u.role === "admin").length <= 1) {
    throw new Error("Cannot delete the last admin user");
  }

  db.users = db.users.filter((u) => u.id !== id);
  db.enrollments = (db.enrollments ?? []).filter((e) => e.userId !== id);
  await writeDb(db);
  return true;
}

export async function bulkUpdateUserStatus(ids: string[], status: User["status"]): Promise<number> {
  const db = await readDb();
  let count = 0;
  const ts = now();
  for (const id of ids) {
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) continue;
    db.users[idx] = { ...db.users[idx], status, updatedAt: ts };
    count++;
  }
  await writeDb(db);
  return count;
}

export async function enrollUser(userId: string, courseId: string): Promise<Enrollment> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  const course = db.courses.find((c) => c.id === courseId);
  if (!user) throw new Error("User not found");
  if (!course) throw new Error("Course not found");
  if (user.role !== "student") throw new Error("Only students can be enrolled in courses");

  const existing = (db.enrollments ?? []).find((e) => e.userId === userId && e.courseId === courseId && e.status !== "dropped");
  if (existing) throw new Error("Student is already enrolled in this course");

  const ts = now();
  const enrollment: Enrollment = {
    id: randomUUID(),
    userId,
    courseId,
    courseTitle: course.title,
    progress: 0,
    status: "active",
    enrolledAt: ts,
    createdAt: ts,
    updatedAt: ts,
  };

  if (!db.enrollments) db.enrollments = [];
  db.enrollments.unshift(enrollment);

  const cIdx = db.courses.findIndex((c) => c.id === courseId);
  if (cIdx !== -1) db.courses[cIdx] = { ...db.courses[cIdx], enrollments: db.courses[cIdx].enrollments + 1 };

  const { pushActivity } = await import("@/lib/notifications/notification-service");
  pushActivity(db, {
    message: `${user.name} enrolled in ${course.title}`,
    type: "enrollment",
    audience: "admin",
    href: "/admin/users",
  });
  pushActivity(db, {
    message: `You're enrolled in ${course.title}. Start learning anytime.`,
    type: "enrollment",
    userId: user.id,
    audience: "student",
    href: `/courses/${course.id}/learn`,
  });

  recomputeInstructorStatsLocal(db);
  await writeDb(db);
  return enrollment;
}

export async function removeEnrollment(enrollmentId: string): Promise<boolean> {
  const db = await readDb();
  const idx = (db.enrollments ?? []).findIndex((e) => e.id === enrollmentId);
  if (idx === -1) return false;

  const enrollment = db.enrollments[idx];
  db.enrollments[idx] = { ...enrollment, status: "dropped", updatedAt: now() };

  const cIdx = db.courses.findIndex((c) => c.id === enrollment.courseId);
  if (cIdx !== -1 && db.courses[cIdx].enrollments > 0) {
    db.courses[cIdx] = { ...db.courses[cIdx], enrollments: db.courses[cIdx].enrollments - 1 };
  }

  recomputeInstructorStatsLocal(db);
  await writeDb(db);
  return true;
}
