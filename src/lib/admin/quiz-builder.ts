import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import { normalizeQuiz } from "./exam-engine";
import { recomputeQuizAttemptCounts } from "./quiz-service";
import type { ExamQuestion, Quiz, QuizBuilderInput } from "./types";

const now = () => new Date().toISOString();

function buildQuestions(items: QuizBuilderInput["questionItems"]): ExamQuestion[] {
  return items.map((q, i) => ({
    id: q.id ?? randomUUID(),
    text: q.text,
    type: q.type,
    options: q.options.map((o) => ({ id: o.id || randomUUID(), text: o.text })),
    correctOptionIds: q.correctOptionIds,
    marks: Number(q.marks) || 1,
    negativeMarks: q.negativeMarks ? Number(q.negativeMarks) : undefined,
    order: i + 1,
    explanation: q.explanation,
  }));
}

export async function createQuizFull(input: QuizBuilderInput): Promise<Quiz> {
  const db = await readDb();
  const ts = now();
  const course = input.courseId ? db.courses.find((c) => c.id === input.courseId) : undefined;
  const questionItems = buildQuestions(input.questionItems);
  const totalMarks = questionItems.reduce((s, q) => s + q.marks, 0);
  const passingPercentage = input.passingPercentage;

  const quiz: Quiz = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    courseId: input.courseId || undefined,
    courseTitle: course?.title,
    instructorId: input.instructorId,
    quizKind: input.quizKind,
    instructions: input.instructions,
    durationMinutes: input.durationMinutes,
    totalMarks,
    passingMarks: Math.ceil((totalMarks * passingPercentage) / 100),
    passingPercentage,
    maxAttempts: input.maxAttempts,
    shuffleQuestions: input.shuffleQuestions,
    shuffleOptions: input.shuffleOptions,
    showResultsInstantly: input.showResultsInstantly,
    issueCertificateOnPass: input.issueCertificateOnPass,
    certificateTemplate: input.certificateTemplate ?? "classic-maroon",
    enableProctoring: input.enableProctoring,
    maxProctorViolations: input.maxProctorViolations,
    autoSubmitOnProctorViolation: input.autoSubmitOnProctorViolation,
    requireFullscreen: input.requireFullscreen,
    questionItems,
    questions: questionItems.length,
    attempts: 0,
    status: input.status,
    createdAt: ts,
    updatedAt: ts,
  };

  db.quizzes.unshift(quiz);
  recomputeQuizAttemptCounts(db);
  await writeDb(db);
  return quiz;
}

export async function updateQuizFull(id: string, input: QuizBuilderInput): Promise<Quiz | null> {
  const db = await readDb();
  const idx = db.quizzes.findIndex((q) => q.id === id);
  if (idx === -1) return null;

  const ts = now();
  const course = input.courseId ? db.courses.find((c) => c.id === input.courseId) : undefined;
  const questionItems = buildQuestions(input.questionItems);
  const totalMarks = questionItems.reduce((s, q) => s + q.marks, 0);
  const existing = normalizeQuiz(db.quizzes[idx] as unknown as Record<string, unknown>);

  const quiz: Quiz = {
    ...existing,
    title: input.title,
    description: input.description,
    courseId: input.courseId || undefined,
    courseTitle: course?.title,
    instructorId: input.instructorId ?? existing.instructorId,
    quizKind: input.quizKind ?? existing.quizKind,
    instructions: input.instructions,
    durationMinutes: input.durationMinutes,
    totalMarks,
    passingMarks: Math.ceil((totalMarks * input.passingPercentage) / 100),
    passingPercentage: input.passingPercentage,
    maxAttempts: input.maxAttempts,
    shuffleQuestions: input.shuffleQuestions,
    shuffleOptions: input.shuffleOptions,
    showResultsInstantly: input.showResultsInstantly,
    issueCertificateOnPass: input.issueCertificateOnPass,
    certificateTemplate: input.certificateTemplate ?? existing.certificateTemplate ?? "classic-maroon",
    enableProctoring: input.enableProctoring,
    maxProctorViolations: input.maxProctorViolations,
    autoSubmitOnProctorViolation: input.autoSubmitOnProctorViolation,
    requireFullscreen: input.requireFullscreen,
    questionItems,
    questions: questionItems.length,
    status: input.status,
    updatedAt: ts,
  };

  db.quizzes[idx] = quiz;
  recomputeQuizAttemptCounts(db);
  await writeDb(db);
  return quiz;
}

export async function getQuizFull(id: string): Promise<Quiz | null> {
  const db = await readDb();
  const raw = db.quizzes.find((q) => q.id === id);
  if (!raw) return null;
  return normalizeQuiz(raw as unknown as Record<string, unknown>);
}
