import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import {
  buildCertificate,
  gradeExam,
  normalizeAttempt,
  normalizeCertificate,
  normalizeQuiz,
  prepareExamQuestions,
  stripAnswersForStudent,
} from "./exam-engine";
import { recomputeQuizAttemptCounts } from "./quiz-service";
import type { ExamResultPayload, ExamSubmitInput, ProctoringViolation, QuizAttempt } from "./types";

const now = () => new Date().toISOString();

export async function listActiveExams() {
  const db = await readDb();
  return db.quizzes
    .map((q) => normalizeQuiz(q as unknown as Record<string, unknown>))
    .filter((q) => q.status === "active")
    .map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      courseTitle: q.courseTitle,
      durationMinutes: q.durationMinutes,
      totalMarks: q.totalMarks,
      passingPercentage: q.passingPercentage,
      questions: q.questions,
      maxAttempts: q.maxAttempts,
    }));
}

export async function getExamForStudent(quizId: string) {
  const db = await readDb();
  const raw = db.quizzes.find((q) => q.id === quizId);
  if (!raw) return null;
  const quiz = normalizeQuiz(raw as unknown as Record<string, unknown>);
  if (quiz.status !== "active") return null;
  return stripAnswersForStudent(quiz);
}

export async function startExamAttempt(
  quizId: string,
  student: { id: string; name: string; email: string },
) {
  const db = await readDb();
  const raw = db.quizzes.find((q) => q.id === quizId);
  if (!raw) return null;
  const quiz = normalizeQuiz(raw as unknown as Record<string, unknown>);
  if (quiz.status !== "active") return null;

  const priorAttempts = db.quizAttempts.filter(
    (a) => a.quizId === quizId && a.studentId === student.id && a.status !== "in_progress",
  );
  if (priorAttempts.length >= quiz.maxAttempts) {
    return { error: "Maximum attempts reached" as const };
  }

  const inProgress = db.quizAttempts.find(
    (a) => a.quizId === quizId && a.studentId === student.id && a.status === "in_progress",
  );
  const questions = prepareExamQuestions(quiz);
  const examPayload = {
    ...stripAnswersForStudent(quiz),
    questionItems: questions.map(({ correctOptionIds, explanation, ...q }) => q),
  };

  if (inProgress) {
    return {
      attempt: normalizeAttempt(inProgress as unknown as Record<string, unknown>),
      exam: examPayload,
    };
  }

  const ts = now();
  const attempt: QuizAttempt = {
    id: randomUUID(),
    quizId,
    quizTitle: quiz.title,
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    startedAt: ts,
    answers: {},
    score: 0,
    totalMarks: quiz.totalMarks,
    percentage: 0,
    passed: false,
    timeTakenSeconds: 0,
    status: "in_progress",
    createdAt: ts,
    updatedAt: ts,
  };

  db.quizAttempts.unshift(attempt);
  await writeDb(db);

  return {
    attempt,
    exam: examPayload,
  };
}

export async function submitExam(
  quizId: string,
  input: ExamSubmitInput,
  verifyBaseUrl: string,
): Promise<ExamResultPayload | { error: string }> {
  const db = await readDb();
  const raw = db.quizzes.find((q) => q.id === quizId);
  if (!raw) return { error: "Exam not found" };

  const quiz = normalizeQuiz(raw as unknown as Record<string, unknown>);
  const attemptIdx = db.quizAttempts.findIndex((a) => a.id === input.attemptId);
  if (attemptIdx === -1) return { error: "Attempt not found" };

  const attemptRaw = db.quizAttempts[attemptIdx];
  if (attemptRaw.status !== "in_progress") return { error: "Attempt already submitted" };
  if (String(attemptRaw.studentId) !== input.studentId) {
    return { error: "This attempt belongs to another student" };
  }

  const { questionResults, score, totalMarks, percentage } = gradeExam(
    quiz.questionItems,
    input.answers,
  );
  const passed = percentage >= quiz.passingPercentage;
  const ts = now();

  const attempt: QuizAttempt = {
    ...normalizeAttempt(attemptRaw as unknown as Record<string, unknown>),
    studentId: input.studentId,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    submittedAt: ts,
    answers: input.answers,
    score,
    totalMarks,
    percentage,
    passed,
    timeTakenSeconds: input.timeTakenSeconds,
    status: input.autoSubmittedByProctor ? "timed_out" : "submitted",
    tabSwitchCount: input.tabSwitchCount ?? 0,
    proctoringViolations: input.proctoringViolations ?? [],
    autoSubmittedByProctor: Boolean(input.autoSubmittedByProctor),
    questionResults,
    updatedAt: ts,
  };

  db.quizAttempts[attemptIdx] = attempt;

  let certificate;
  if (passed && quiz.issueCertificateOnPass) {
    certificate = await buildCertificate({
      studentId: input.studentId,
      studentName: input.studentName,
      studentEmail: input.studentEmail,
      courseTitle: quiz.courseTitle ?? "Course",
      quizTitle: quiz.title,
      quizId,
      attemptId: attempt.id,
      score,
      percentage,
      verifyBaseUrl,
      template: quiz.certificateTemplate,
    });
    attempt.certificateId = certificate.id;
    db.quizAttempts[attemptIdx] = attempt;
    db.certificates.unshift(certificate);
  }

  recomputeQuizAttemptCounts(db);
  await writeDb(db);
  return { attempt, certificate };
}

export async function getAttemptResult(attemptId: string) {
  const db = await readDb();
  const raw = db.quizAttempts.find((a) => a.id === attemptId);
  if (!raw) return null;
  const attempt = normalizeAttempt(raw as unknown as Record<string, unknown>);
  let certificate;
  if (attempt.certificateId) {
    const certRaw = db.certificates.find((c) => c.id === attempt.certificateId);
    if (certRaw) certificate = normalizeCertificate(certRaw as unknown as Record<string, unknown>);
  }
  return { attempt, certificate };
}

export async function getCertificateById(id: string) {
  const db = await readDb();
  const raw = db.certificates.find((c) => c.id === id);
  if (!raw) return null;
  return normalizeCertificate(raw as unknown as Record<string, unknown>);
}

export async function verifyCertificate(certificateNo: string) {
  const db = await readDb();
  const raw = db.certificates.find((c) => c.certificateNo === certificateNo);
  if (!raw) return null;
  const cert = normalizeCertificate(raw as unknown as Record<string, unknown>);
  if (cert.status === "revoked") return { ...cert, valid: false as const };
  return { ...cert, valid: true as const };
}

export async function logProctorViolation(
  quizId: string,
  attemptId: string,
  violation: ProctoringViolation,
) {
  const db = await readDb();
  const idx = db.quizAttempts.findIndex((a) => a.id === attemptId && a.quizId === quizId);
  if (idx === -1) return null;

  const attempt = normalizeAttempt(db.quizAttempts[idx] as unknown as Record<string, unknown>);
  if (attempt.status !== "in_progress") return attempt;

  const violations = [...(attempt.proctoringViolations ?? []), violation];
  const updated: QuizAttempt = {
    ...attempt,
    tabSwitchCount: violations.filter((v) => v.type === "tab_switch" || v.type === "window_blur").length,
    proctoringViolations: violations,
    updatedAt: new Date().toISOString(),
  };
  db.quizAttempts[idx] = updated;
  await writeDb(db);
  return updated;
}
