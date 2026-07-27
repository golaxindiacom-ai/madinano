import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import type {
  Instructor,
  InstructorDetailPayload,
  InstructorInput,
  InstructorStats,
  User,
} from "./types";

const now = () => new Date().toISOString();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateInput(input: InstructorInput): string | null {
  if (!input.name?.trim()) return "Name is required";
  if (!input.email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Invalid email address";
  if (!input.expertise?.trim()) return "Expertise is required";
  if (!["active", "pending", "inactive"].includes(input.status)) return "Invalid status";
  return null;
}

export function recomputeInstructorStats(db: Awaited<ReturnType<typeof readDb>>) {
  for (const inst of db.instructors) {
    const courses = db.courses.filter((c) => c.instructorId === inst.id);
    const courseIds = courses.map((c) => c.id);
    const students = new Set(
      (db.enrollments ?? [])
        .filter((e) => courseIds.includes(e.courseId) && e.status !== "dropped")
        .map((e) => e.userId),
    );
    const idx = db.instructors.findIndex((i) => i.id === inst.id);
    if (idx !== -1) {
      db.instructors[idx] = {
        ...db.instructors[idx],
        courses: courses.length,
        students: students.size,
      };
    }
  }
}

function userStatusFromInstructor(status: Instructor["status"]): User["status"] {
  if (status === "active") return "active";
  if (status === "inactive") return "suspended";
  return "inactive";
}

async function syncUserAccount(
  instructor: Instructor,
  db: Awaited<ReturnType<typeof readDb>>,
  ts: string,
  extra?: { phone?: string; country?: string },
) {
  const email = normalizeEmail(instructor.email);
  let user = instructor.userId ? db.users.find((u) => u.id === instructor.userId) : undefined;
  if (!user) user = db.users.find((u) => normalizeEmail(u.email) === email);

  if (user) {
    const idx = db.users.findIndex((u) => u.id === user!.id);
    db.users[idx] = {
      ...user,
      name: instructor.name,
      email: instructor.email,
      role: "instructor",
      status: userStatusFromInstructor(instructor.status),
      phone: extra?.phone ?? user.phone,
      country: extra?.country ?? user.country,
      instructorId: instructor.id,
      updatedAt: ts,
    };
    const iIdx = db.instructors.findIndex((i) => i.id === instructor.id);
    if (iIdx !== -1) db.instructors[iIdx] = { ...db.instructors[iIdx], userId: user.id, updatedAt: ts };
    return user.id;
  }

  const newUser: User = {
    id: randomUUID(),
    name: instructor.name,
    email: instructor.email,
    role: "instructor",
    status: userStatusFromInstructor(instructor.status),
    phone: extra?.phone,
    country: extra?.country,
    instructorId: instructor.id,
    createdAt: ts,
    updatedAt: ts,
  };
  db.users.unshift(newUser);
  const iIdx = db.instructors.findIndex((i) => i.id === instructor.id);
  if (iIdx !== -1) db.instructors[iIdx] = { ...db.instructors[iIdx], userId: newUser.id, updatedAt: ts };
  return newUser.id;
}

export async function getInstructorStats(): Promise<InstructorStats> {
  const db = await readDb();
  recomputeInstructorStats(db);
  const items = db.instructors;
  return {
    total: items.length,
    active: items.filter((i) => i.status === "active").length,
    pending: items.filter((i) => i.status === "pending").length,
    inactive: items.filter((i) => i.status === "inactive").length,
    totalCourses: items.reduce((s, i) => s + i.courses, 0),
    totalStudents: items.reduce((s, i) => s + i.students, 0),
  };
}

export type ListInstructorsOptions = {
  search?: string;
  status?: Instructor["status"] | "all";
};

export async function listInstructors(options: ListInstructorsOptions = {}): Promise<Instructor[]> {
  const db = await readDb();
  recomputeInstructorStats(db);
  await writeDb(db);

  let items = [...db.instructors];

  if (options.status && options.status !== "all") {
    items = items.filter((i) => i.status === options.status);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    items = items.filter((i) =>
      [i.name, i.email, i.expertise, i.bio, i.country].some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }

  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getInstructorDetail(id: string): Promise<InstructorDetailPayload | null> {
  const db = await readDb();
  recomputeInstructorStats(db);
  const instructor = db.instructors.find((i) => i.id === id);
  if (!instructor) return null;

  const courses = db.courses.filter((c) => c.instructorId === id);
  const quizzes = db.quizzes.filter((q) => q.instructorId === id || courses.some((c) => c.id === q.courseId));
  const courseIds = courses.map((c) => c.id);
  const uniqueStudents = new Set(
    (db.enrollments ?? [])
      .filter((e) => courseIds.includes(e.courseId) && e.status !== "dropped")
      .map((e) => e.userId),
  ).size;

  const user = instructor.userId ? db.users.find((u) => u.id === instructor.userId) ?? null : null;

  return { instructor, user, courses, quizzes, uniqueStudents };
}

export async function createInstructor(input: InstructorInput): Promise<Instructor> {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const db = await readDb();
  const email = normalizeEmail(input.email);
  if (db.instructors.some((i) => normalizeEmail(i.email) === email)) {
    throw new Error("An instructor with this email already exists");
  }
  if (db.users.some((u) => normalizeEmail(u.email) === email && u.role !== "instructor")) {
    throw new Error("This email is already used by a non-instructor account");
  }

  const ts = now();
  const baseSlug = slugify(input.name.trim());
  let slug = baseSlug;
  let n = 1;
  while (db.instructors.some((i) => i.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }

  const instructor: Instructor = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    expertise: input.expertise.trim(),
    bio: input.bio?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    country: input.country?.trim() || undefined,
    courses: 0,
    students: 0,
    rating: Number(input.rating) || 0,
    status: input.status,
    slug,
    createdAt: ts,
    updatedAt: ts,
  };

  db.instructors.unshift(instructor);
  await syncUserAccount(instructor, db, ts, { phone: instructor.phone, country: instructor.country });
  recomputeInstructorStats(db);
  await writeDb(db);

  return db.instructors.find((i) => i.id === instructor.id) ?? instructor;
}

export async function updateInstructor(id: string, input: InstructorInput): Promise<Instructor | null> {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const db = await readDb();
  const idx = db.instructors.findIndex((i) => i.id === id);
  if (idx === -1) return null;

  const email = normalizeEmail(input.email);
  if (db.instructors.some((i) => i.id !== id && normalizeEmail(i.email) === email)) {
    throw new Error("An instructor with this email already exists");
  }

  const ts = now();
  const instructor: Instructor = {
    ...db.instructors[idx],
    name: input.name.trim(),
    email: input.email.trim(),
    expertise: input.expertise.trim(),
    bio: input.bio?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    country: input.country?.trim() || undefined,
    rating: Number(input.rating) ?? db.instructors[idx].rating,
    status: input.status,
    updatedAt: ts,
  };

  db.instructors[idx] = instructor;
  await syncUserAccount(instructor, db, ts, { phone: instructor.phone, country: instructor.country });
  recomputeInstructorStats(db);
  await writeDb(db);

  return db.instructors.find((i) => i.id === id) ?? null;
}

export async function deleteInstructor(id: string): Promise<boolean> {
  const db = await readDb();
  const instructor = db.instructors.find((i) => i.id === id);
  if (!instructor) return false;

  const assignedCourses = db.courses.filter((c) => c.instructorId === id);
  if (assignedCourses.length > 0) {
    throw new Error(
      `Cannot delete — instructor has ${assignedCourses.length} course(s). Reassign courses first.`,
    );
  }

  db.instructors = db.instructors.filter((i) => i.id !== id);

  if (instructor.userId) {
    const uIdx = db.users.findIndex((u) => u.id === instructor.userId);
    if (uIdx !== -1) {
      db.users[uIdx] = {
        ...db.users[uIdx],
        role: "student",
        instructorId: undefined,
        updatedAt: now(),
      };
    }
  }

  await writeDb(db);
  return true;
}

export async function listActiveInstructorsForPicker(): Promise<Pick<Instructor, "id" | "name" | "email" | "expertise" | "status">[]> {
  const items = await listInstructors({ status: "active" });
  return items.map(({ id, name, email, expertise, status }) => ({ id, name, email, expertise, status }));
}
