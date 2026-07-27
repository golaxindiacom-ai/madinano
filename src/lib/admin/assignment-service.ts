import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import { normalizeCourse } from "./course-builder";
import type {
  AdminDatabase,
  Assignment,
  AssignmentDetailPayload,
  AssignmentInput,
  AssignmentListItem,
  AssignmentStats,
  AssignmentSubmission,
  Course,
  GradeSubmissionInput,
} from "./types";

const now = () => new Date().toISOString();

export function normalizeAssignment(raw: Record<string, unknown>): Assignment {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    title: String(raw.title ?? ""),
    courseId: String(raw.courseId ?? ""),
    sectionId: raw.sectionId ? String(raw.sectionId) : undefined,
    lessonId: raw.lessonId ? String(raw.lessonId) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    instructions: raw.instructions ? String(raw.instructions) : undefined,
    dueDate: String(raw.dueDate ?? ""),
    maxMarks: raw.maxMarks != null ? Number(raw.maxMarks) : undefined,
    allowLateSubmission: Boolean(raw.allowLateSubmission),
    submissions: Number(raw.submissions ?? 0),
    status: (raw.status as Assignment["status"]) ?? "open",
  };
}

function getSectionTitle(course: Course, sectionId?: string) {
  if (!sectionId) return undefined;
  return course.curriculum.find((s) => s.id === sectionId)?.title;
}

function isOverdue(assignment: Assignment) {
  if (assignment.status === "closed") return false;
  const due = new Date(assignment.dueDate);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function getSubmissions(db: AdminDatabase, assignmentId: string) {
  return (db.assignmentSubmissions ?? []).filter((s) => s.assignmentId === assignmentId);
}

export function recomputeAssignmentSubmissionCount(db: AdminDatabase, assignmentId: string) {
  const count = getSubmissions(db, assignmentId).length;
  const idx = db.assignments.findIndex((a) => a.id === assignmentId);
  if (idx !== -1) {
    db.assignments[idx] = { ...db.assignments[idx], submissions: count };
  }
}

function enrichAssignment(db: AdminDatabase, assignment: Assignment): AssignmentListItem {
  const courseRaw = db.courses.find((c) => c.id === assignment.courseId);
  const course = courseRaw
    ? normalizeCourse(courseRaw as unknown as Record<string, unknown>)
    : null;
  const instructor = course
    ? db.instructors.find((i) => i.id === course.instructorId)
    : undefined;
  const subs = getSubmissions(db, assignment.id);

  return {
    ...assignment,
    courseTitle: course?.title ?? "Unknown course",
    sectionTitle: course ? getSectionTitle(course, assignment.sectionId) : undefined,
    instructorName: instructor?.name ?? "—",
    isOverdue: isOverdue(assignment),
    pendingGrading: subs.filter((s) => s.status === "submitted").length,
  };
}

function validateInput(input: AssignmentInput, db: AdminDatabase, selfId?: string): string | null {
  if (!input.title?.trim()) return "Assignment title is required";
  if (!input.courseId) return "Course is required";
  if (!input.dueDate) return "Due date is required";
  if (!["open", "closed"].includes(input.status)) return "Invalid status";

  const due = new Date(input.dueDate);
  if (Number.isNaN(due.getTime())) return "Invalid due date";

  const courseRaw = db.courses.find((c) => c.id === input.courseId);
  if (!courseRaw) return "Course not found";
  const course = normalizeCourse(courseRaw as unknown as Record<string, unknown>);

  if (input.sectionId) {
    const section = course.curriculum.find((s) => s.id === input.sectionId);
    if (!section) return "Section not found in selected course";
  }

  if (input.lessonId) {
    const lesson = db.lessons.find((l) => l.id === input.lessonId);
    if (!lesson) return "Linked lesson not found";
    if (lesson.courseId !== input.courseId) return "Lesson must belong to the selected course";
    if (lesson.lessonType !== "assignment") return "Linked lesson must be an assignment-type lesson";
  }

  if (input.maxMarks != null && input.maxMarks < 0) return "Max marks cannot be negative";

  if (selfId) {
    const existing = db.assignments.find((a) => a.id === selfId);
    if (!existing) return "Assignment not found";
  }

  return null;
}

export type ListAssignmentsOptions = {
  search?: string;
  status?: Assignment["status"] | "all";
  courseId?: string;
  overdue?: boolean;
};

export async function getAssignmentStats(): Promise<AssignmentStats> {
  const db = await readDb();
  const assignments = db.assignments.map((a) =>
    normalizeAssignment(a as unknown as Record<string, unknown>),
  );
  const submissions = db.assignmentSubmissions ?? [];
  const courseIds = new Set(assignments.map((a) => a.courseId));

  return {
    total: assignments.length,
    open: assignments.filter((a) => a.status === "open").length,
    closed: assignments.filter((a) => a.status === "closed").length,
    overdue: assignments.filter((a) => isOverdue(a)).length,
    totalSubmissions: submissions.length,
    pendingGrading: submissions.filter((s) => s.status === "submitted").length,
    coursesWithAssignments: courseIds.size,
  };
}

export async function listAssignments(options: ListAssignmentsOptions = {}): Promise<AssignmentListItem[]> {
  const db = await readDb();
  let assignments = db.assignments.map((a) =>
    normalizeAssignment(a as unknown as Record<string, unknown>),
  );

  if (options.status && options.status !== "all") {
    assignments = assignments.filter((a) => a.status === options.status);
  }
  if (options.courseId) {
    assignments = assignments.filter((a) => a.courseId === options.courseId);
  }
  if (options.overdue) {
    assignments = assignments.filter((a) => isOverdue(a));
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    assignments = assignments.filter((a) => {
      const enriched = enrichAssignment(db, a);
      return [a.title, a.description, enriched.courseTitle, enriched.instructorName].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      );
    });
  }

  return assignments
    .map((a) => enrichAssignment(db, a))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function getAssignmentDetail(id: string): Promise<AssignmentDetailPayload | null> {
  const db = await readDb();
  const raw = db.assignments.find((a) => a.id === id);
  if (!raw) return null;

  const assignment = normalizeAssignment(raw as unknown as Record<string, unknown>);
  const enriched = enrichAssignment(db, assignment);
  const lesson = assignment.lessonId
    ? db.lessons.find((l) => l.id === assignment.lessonId)
    : undefined;

  const submissions = getSubmissions(db, id)
    .map((sub) => {
      const user = db.users.find((u) => u.id === sub.userId);
      return {
        ...sub,
        userName: user?.name ?? "Unknown student",
        userEmail: user?.email ?? "—",
      };
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return {
    assignment,
    courseTitle: enriched.courseTitle,
    sectionTitle: enriched.sectionTitle,
    instructorName: enriched.instructorName,
    lessonTitle: lesson?.title,
    isOverdue: enriched.isOverdue,
    submissions,
  };
}

export async function createAssignment(input: AssignmentInput): Promise<AssignmentListItem> {
  const db = await readDb();
  const err = validateInput(input, db);
  if (err) throw new Error(err);

  const ts = now();
  const assignment: Assignment = {
    id: randomUUID(),
    title: input.title.trim(),
    courseId: input.courseId,
    sectionId: input.sectionId || undefined,
    lessonId: input.lessonId || undefined,
    description: input.description?.trim() || undefined,
    instructions: input.instructions?.trim() || undefined,
    dueDate: new Date(input.dueDate).toISOString(),
    maxMarks: input.maxMarks != null ? Number(input.maxMarks) : 100,
    allowLateSubmission: Boolean(input.allowLateSubmission),
    submissions: 0,
    status: input.status,
    createdAt: ts,
    updatedAt: ts,
  };

  db.assignments.unshift(assignment);
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichAssignment(dbFresh, assignment);
}

export async function updateAssignment(id: string, input: AssignmentInput): Promise<AssignmentListItem | null> {
  const db = await readDb();
  const idx = db.assignments.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const err = validateInput(input, db, id);
  if (err) throw new Error(err);

  const existing = normalizeAssignment(db.assignments[idx] as unknown as Record<string, unknown>);
  const ts = now();

  const assignment: Assignment = {
    ...existing,
    title: input.title.trim(),
    courseId: input.courseId,
    sectionId: input.sectionId || undefined,
    lessonId: input.lessonId || undefined,
    description: input.description?.trim() || undefined,
    instructions: input.instructions?.trim() || undefined,
    dueDate: new Date(input.dueDate).toISOString(),
    maxMarks: input.maxMarks != null ? Number(input.maxMarks) : existing.maxMarks,
    allowLateSubmission: Boolean(input.allowLateSubmission),
    status: input.status,
    updatedAt: ts,
  };

  db.assignments[idx] = assignment;
  recomputeAssignmentSubmissionCount(db, id);
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichAssignment(dbFresh, assignment);
}

export async function updateAssignmentStatus(
  id: string,
  status: Assignment["status"],
): Promise<Assignment | null> {
  const db = await readDb();
  const idx = db.assignments.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  db.assignments[idx] = {
    ...db.assignments[idx],
    status,
    updatedAt: now(),
  };
  await writeDb(db);
  return normalizeAssignment(db.assignments[idx] as unknown as Record<string, unknown>);
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const db = await readDb();
  if (!db.assignments.some((a) => a.id === id)) return false;

  db.assignments = db.assignments.filter((a) => a.id !== id);
  db.assignmentSubmissions = (db.assignmentSubmissions ?? []).filter((s) => s.assignmentId !== id);
  await writeDb(db);
  return true;
}

export async function gradeSubmission(
  submissionId: string,
  input: GradeSubmissionInput,
): Promise<AssignmentSubmission | null> {
  const db = await readDb();
  const idx = (db.assignmentSubmissions ?? []).findIndex((s) => s.id === submissionId);
  if (idx === -1) return null;

  const submission = db.assignmentSubmissions![idx];
  const assignment = db.assignments.find((a) => a.id === submission.assignmentId);
  if (!assignment) throw new Error("Assignment not found");

  const maxMarks = assignment.maxMarks ?? 100;
  if (input.marks < 0 || input.marks > maxMarks) {
    throw new Error(`Marks must be between 0 and ${maxMarks}`);
  }

  db.assignmentSubmissions![idx] = {
    ...submission,
    marks: input.marks,
    feedback: input.feedback?.trim() || undefined,
    status: input.status ?? "graded",
    updatedAt: now(),
  };
  await writeDb(db);
  return db.assignmentSubmissions![idx];
}

export async function listCoursesForAssignments() {
  const db = await readDb();
  return db.courses
    .map((c) => normalizeCourse(c as unknown as Record<string, unknown>))
    .map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      curriculum: c.curriculum,
      instructorId: c.instructorId,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function listAssignmentLessons(courseId: string) {
  const db = await readDb();
  return db.lessons
    .filter((l) => l.courseId === courseId && l.lessonType === "assignment")
    .map((l) => ({ id: l.id, title: l.title, sectionId: l.sectionId }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
