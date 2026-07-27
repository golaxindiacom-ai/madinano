import { readDb, writeDb } from "./db";
import { normalizeAttempt, normalizeCertificate, normalizeQuiz } from "./exam-engine";
import { recomputeQuizAttemptCounts } from "./quiz-service";
import type {
  AdminDatabase,
  QuizAttempt,
  QuizAttemptDetailPayload,
  QuizAttemptListItem,
  QuizAttemptStats,
} from "./types";

const now = () => new Date().toISOString();

function enrichAttempt(db: AdminDatabase, attempt: QuizAttempt): QuizAttemptListItem {
  const quiz = db.quizzes.find((q) => q.id === attempt.quizId);
  const normalized = quiz
    ? normalizeQuiz(quiz as unknown as Record<string, unknown>)
    : undefined;

  return {
    ...attempt,
    courseTitle: normalized?.courseTitle,
    quizKind: normalized?.quizKind,
    hasCertificate: Boolean(attempt.certificateId),
    violationCount: attempt.proctoringViolations?.length ?? attempt.tabSwitchCount ?? 0,
  };
}

export type ListQuizAttemptsOptions = {
  search?: string;
  status?: QuizAttempt["status"] | "all";
  result?: "all" | "passed" | "failed" | "in_progress";
  quizId?: string;
  studentId?: string;
  hasViolations?: boolean;
};

export async function getQuizAttemptStats(): Promise<QuizAttemptStats> {
  const db = await readDb();
  const attempts = db.quizAttempts.map((a) =>
    normalizeAttempt(a as unknown as Record<string, unknown>),
  );

  const finished = attempts.filter((a) => a.status !== "in_progress");

  return {
    total: attempts.length,
    inProgress: attempts.filter((a) => a.status === "in_progress").length,
    submitted: attempts.filter((a) => a.status === "submitted").length,
    timedOut: attempts.filter((a) => a.status === "timed_out").length,
    passed: finished.filter((a) => a.passed).length,
    failed: finished.filter((a) => a.passed === false).length,
    withViolations: attempts.filter(
      (a) => (a.proctoringViolations?.length ?? a.tabSwitchCount ?? 0) > 0,
    ).length,
    certificatesIssued: attempts.filter((a) => a.certificateId).length,
  };
}

export async function listQuizAttempts(
  options: ListQuizAttemptsOptions = {},
): Promise<QuizAttemptListItem[]> {
  const db = await readDb();
  let attempts = db.quizAttempts.map((a) =>
    normalizeAttempt(a as unknown as Record<string, unknown>),
  );

  if (options.status && options.status !== "all") {
    attempts = attempts.filter((a) => a.status === options.status);
  }
  if (options.result && options.result !== "all") {
    if (options.result === "in_progress") {
      attempts = attempts.filter((a) => a.status === "in_progress");
    } else if (options.result === "passed") {
      attempts = attempts.filter((a) => a.status !== "in_progress" && a.passed);
    } else if (options.result === "failed") {
      attempts = attempts.filter((a) => a.status !== "in_progress" && !a.passed);
    }
  }
  if (options.quizId) {
    attempts = attempts.filter((a) => a.quizId === options.quizId);
  }
  if (options.studentId) {
    attempts = attempts.filter((a) => a.studentId === options.studentId);
  }
  if (options.hasViolations) {
    attempts = attempts.filter(
      (a) => (a.proctoringViolations?.length ?? a.tabSwitchCount ?? 0) > 0,
    );
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    attempts = attempts.filter((a) => {
      const enriched = enrichAttempt(db, a);
      return [
        a.studentName,
        a.studentEmail,
        a.quizTitle,
        enriched.courseTitle,
      ].some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }

  return attempts
    .map((a) => enrichAttempt(db, a))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export async function getQuizAttemptDetail(id: string): Promise<QuizAttemptDetailPayload | null> {
  const db = await readDb();
  const raw = db.quizAttempts.find((a) => a.id === id);
  if (!raw) return null;

  const attempt = enrichAttempt(db, normalizeAttempt(raw as unknown as Record<string, unknown>));
  const quizRaw = db.quizzes.find((q) => q.id === attempt.quizId);
  const quiz = quizRaw
    ? normalizeQuiz(quizRaw as unknown as Record<string, unknown>)
    : undefined;

  let certificate;
  if (attempt.certificateId) {
    const certRaw = db.certificates.find((c) => c.id === attempt.certificateId);
    if (certRaw) {
      certificate = normalizeCertificate(certRaw as unknown as Record<string, unknown>);
    }
  }

  return {
    attempt,
    quiz: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          passingPercentage: quiz.passingPercentage,
          durationMinutes: quiz.durationMinutes,
          quizKind: quiz.quizKind,
          courseTitle: quiz.courseTitle,
          questionItems: quiz.questionItems,
        }
      : undefined,
    certificate,
  };
}

export async function deleteQuizAttempt(id: string): Promise<boolean> {
  const db = await readDb();
  const attempt = db.quizAttempts.find((a) => a.id === id);
  if (!attempt) return false;

  if (attempt.certificateId) {
    db.certificates = db.certificates.filter((c) => c.id !== attempt.certificateId);
  }

  db.quizAttempts = db.quizAttempts.filter((a) => a.id !== id);
  recomputeQuizAttemptCounts(db);
  await writeDb(db);
  return true;
}

export async function listQuizzesForAttempts() {
  const db = await readDb();
  return db.quizzes
    .map((q) => normalizeQuiz(q as unknown as Record<string, unknown>))
    .map((q) => ({ id: q.id, title: q.title, courseTitle: q.courseTitle }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function listStudentsForAttempts() {
  const db = await readDb();
  const studentIds = new Set(
    db.quizAttempts.map((a) => a.studentId).filter(Boolean),
  );
  return db.users
    .filter((u) => studentIds.has(u.id) || u.role === "student")
    .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
