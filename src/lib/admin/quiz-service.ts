import { readDb, writeDb } from "./db";
import { normalizeCourse } from "./course-builder";
import { normalizeQuiz } from "./exam-engine";
import type {
  AdminDatabase,
  Quiz,
  QuizAdminDetail,
  QuizAttempt,
  QuizKind,
  QuizListItem,
  QuizStats,
} from "./types";

const now = () => new Date().toISOString();

function normalizeQuizRow(raw: Record<string, unknown>): Quiz {
  const quiz = normalizeQuiz(raw);
  return {
    ...quiz,
    courseId: quiz.courseId && quiz.courseId !== "" ? quiz.courseId : undefined,
  };
}

export function recomputeQuizAttemptCounts(db: AdminDatabase) {
  for (const raw of db.quizzes) {
    const quizId = String(raw.id);
    const count = db.quizAttempts.filter((a) => a.quizId === quizId).length;
    const idx = db.quizzes.findIndex((q) => q.id === quizId);
    if (idx !== -1) {
      db.quizzes[idx] = { ...db.quizzes[idx], attempts: count };
    }
  }
}

function isQuizLinked(db: AdminDatabase, quiz: Quiz): boolean {
  if (quiz.lessonId && db.lessons.some((l) => l.id === quiz.lessonId && l.quizId === quiz.id)) {
    return true;
  }
  if (quiz.courseId && db.courses.some((c) => c.finalExamQuizId === quiz.id)) {
    return true;
  }
  if (db.lessons.some((l) => l.quizId === quiz.id)) return true;
  return false;
}

function enrichQuiz(db: AdminDatabase, quiz: Quiz): QuizListItem {
  const instructor = quiz.instructorId
    ? db.instructors.find((i) => i.id === quiz.instructorId)
    : undefined;
  const lesson = quiz.lessonId ? db.lessons.find((l) => l.id === quiz.lessonId) : undefined;
  const courseRaw = quiz.courseId ? db.courses.find((c) => c.id === quiz.courseId) : undefined;
  const course = courseRaw
    ? normalizeCourse(courseRaw as unknown as Record<string, unknown>)
    : undefined;
  const attemptCount = db.quizAttempts.filter((a) => a.quizId === quiz.id).length;

  return {
    ...quiz,
    courseId: quiz.courseId || undefined,
    courseTitle: quiz.courseTitle || course?.title,
    instructorName: instructor?.name,
    lessonTitle: lesson?.title,
    isLinked: isQuizLinked(db, quiz),
    attemptCount,
    attempts: attemptCount,
  };
}

export type ListQuizzesOptions = {
  search?: string;
  status?: Quiz["status"] | "all";
  quizKind?: QuizKind | "library" | "all";
  courseId?: string;
  instructorId?: string;
};

export async function getQuizStats(): Promise<QuizStats> {
  const db = await readDb();
  recomputeQuizAttemptCounts(db);
  const quizzes = db.quizzes.map((q) =>
    normalizeQuizRow(q as unknown as Record<string, unknown>),
  );

  return {
    total: quizzes.length,
    active: quizzes.filter((q) => q.status === "active").length,
    draft: quizzes.filter((q) => q.status === "draft").length,
    inactive: quizzes.filter((q) => q.status === "inactive").length,
    lessonQuizzes: quizzes.filter((q) => q.quizKind === "lesson_quiz").length,
    finalExams: quizzes.filter((q) => q.quizKind === "final_exam").length,
    library: quizzes.filter((q) => !q.courseId && !q.lessonId).length,
    totalAttempts: db.quizAttempts.length,
  };
}

export async function listQuizzes(options: ListQuizzesOptions = {}): Promise<QuizListItem[]> {
  const db = await readDb();
  recomputeQuizAttemptCounts(db);
  await writeDb(db);

  let quizzes = db.quizzes.map((q) =>
    normalizeQuizRow(q as unknown as Record<string, unknown>),
  );

  if (options.status && options.status !== "all") {
    quizzes = quizzes.filter((q) => q.status === options.status);
  }
  if (options.quizKind && options.quizKind !== "all") {
    if (options.quizKind === "library") {
      quizzes = quizzes.filter((q) => !q.courseId && !q.lessonId);
    } else {
      quizzes = quizzes.filter((q) => q.quizKind === options.quizKind);
    }
  }
  if (options.courseId) {
    quizzes = quizzes.filter((q) => q.courseId === options.courseId);
  }
  if (options.instructorId) {
    quizzes = quizzes.filter((q) => !q.instructorId || q.instructorId === options.instructorId);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    quizzes = quizzes.filter((quiz) => {
      const enriched = enrichQuiz(db, quiz);
      return [quiz.title, quiz.description, enriched.courseTitle, enriched.instructorName, enriched.lessonTitle].some(
        (v) => String(v ?? "").toLowerCase().includes(q),
      );
    });
  }

  return quizzes
    .map((q) => enrichQuiz(db, q))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getQuizAdminDetail(id: string): Promise<QuizAdminDetail | null> {
  const db = await readDb();
  recomputeQuizAttemptCounts(db);
  const raw = db.quizzes.find((q) => q.id === id);
  if (!raw) return null;

  const quiz = enrichQuiz(db, normalizeQuizRow(raw as unknown as Record<string, unknown>));
  const attempts = db.quizAttempts
    .filter((a) => a.quizId === id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()) as QuizAttempt[];

  const links: QuizAdminDetail["links"] = [];
  if (quiz.courseId) {
    links.push({
      type: "course",
      label: quiz.courseTitle ?? "Course",
      href: `/admin/courses/${quiz.courseId}/edit`,
    });
  }
  if (quiz.lessonId && quiz.lessonTitle) {
    links.push({
      type: "lesson",
      label: quiz.lessonTitle,
      href: `/admin/lessons`,
    });
  }
  const finalExamCourse = db.courses.find((c) => c.finalExamQuizId === id);
  if (finalExamCourse) {
    links.push({
      type: "final_exam",
      label: `Final exam: ${finalExamCourse.title}`,
      href: `/admin/courses/${finalExamCourse.id}/edit`,
    });
  }

  return {
    quiz,
    instructorName: quiz.instructorName,
    lessonTitle: quiz.lessonTitle,
    courseTitle: quiz.courseTitle,
    attempts,
    links,
  };
}

export async function updateQuizStatus(id: string, status: Quiz["status"]): Promise<Quiz | null> {
  const db = await readDb();
  const idx = db.quizzes.findIndex((q) => q.id === id);
  if (idx === -1) return null;

  db.quizzes[idx] = {
    ...db.quizzes[idx],
    status,
    updatedAt: now(),
  };
  await writeDb(db);
  return normalizeQuizRow(db.quizzes[idx] as unknown as Record<string, unknown>);
}

export async function deleteQuizFull(id: string, force = false): Promise<boolean> {
  const db = await readDb();
  const raw = db.quizzes.find((q) => q.id === id);
  if (!raw) return false;

  const quiz = normalizeQuizRow(raw as unknown as Record<string, unknown>);
  const linkedLessons = db.lessons.filter((l) => l.quizId === id);
  const finalExamCourses = db.courses.filter((c) => c.finalExamQuizId === id);

  if (!force && (linkedLessons.length > 0 || finalExamCourses.length > 0)) {
    const parts: string[] = [];
    if (linkedLessons.length > 0) parts.push(`${linkedLessons.length} lesson(s)`);
    if (finalExamCourses.length > 0) parts.push(`${finalExamCourses.length} course final exam(s)`);
    throw new Error(`Quiz is linked to ${parts.join(" and ")}. Unlink from course builder first, or use force delete.`);
  }

  for (const lesson of linkedLessons) {
    const idx = db.lessons.findIndex((l) => l.id === lesson.id);
    if (idx !== -1) {
      db.lessons[idx] = { ...db.lessons[idx], quizId: undefined, updatedAt: now() };
    }
  }

  for (const course of finalExamCourses) {
    const idx = db.courses.findIndex((c) => c.id === course.id);
    if (idx !== -1) {
      db.courses[idx] = { ...db.courses[idx], finalExamQuizId: undefined, updatedAt: now() };
    }
  }

  const attemptIds = db.quizAttempts.filter((a) => a.quizId === id).map((a) => a.id);
  db.quizAttempts = db.quizAttempts.filter((a) => a.quizId !== id);
  db.certificates = db.certificates.filter((c) => !attemptIds.includes(c.attemptId));
  db.quizzes = db.quizzes.filter((q) => q.id !== id);

  await writeDb(db);
  return true;
}

export async function listCoursesForQuizzes() {
  const db = await readDb();
  return db.courses
    .map((c) => normalizeCourse(c as unknown as Record<string, unknown>))
    .map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      instructorId: c.instructorId,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function listInstructorsForQuizzes() {
  const db = await readDb();
  return db.instructors
    .filter((i) => i.status === "active")
    .map((i) => ({ id: i.id, name: i.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isQuizAvailable(quiz: Quiz, forCourseId?: string): boolean {
  if (quiz.lessonId && quiz.courseId && forCourseId && quiz.courseId !== forCourseId) return false;
  if (quiz.quizKind === "final_exam" && quiz.courseId && forCourseId && quiz.courseId !== forCourseId) return false;
  if (!quiz.courseId && !quiz.lessonId) return true;
  if (forCourseId && quiz.courseId === forCourseId) return true;
  if (!quiz.lessonId && quiz.quizKind !== "final_exam") return true;
  return false;
}

export async function listAvailableQuizzes(options: {
  kind?: QuizKind | "any";
  instructorId?: string;
  courseId?: string;
}) {
  const db = await readDb();
  let items = db.quizzes.map((q) => normalizeQuizRow(q as unknown as Record<string, unknown>));

  if (options.instructorId) {
    items = items.filter((q) => !q.instructorId || q.instructorId === options.instructorId);
  }
  if (options.courseId) {
    items = items.filter((q) => !q.courseId || q.courseId === options.courseId);
  }
  items = items.filter((q) => isQuizAvailable(q, options.courseId));
  if (options.kind && options.kind !== "any") {
    items = items.filter((q) => !q.quizKind || q.quizKind === options.kind);
  }

  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
