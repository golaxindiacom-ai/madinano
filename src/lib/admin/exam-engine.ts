import { randomUUID } from "crypto";
import QRCode from "qrcode";
import { defaultQuestion } from "@/lib/exam/question-utils";
import type {
  Certificate,
  ExamQuestion,
  Quiz,
  QuizAttempt,
  QuestionType,
} from "./types";

export function normalizeQuiz(raw: Record<string, unknown>): Quiz {
  const questionItems = Array.isArray(raw.questionItems)
    ? (raw.questionItems as ExamQuestion[])
    : [];
  const totalMarks = questionItems.reduce((s, q) => s + (q.marks ?? 1), 0);
  const passingPercentage = Number(raw.passingPercentage ?? 60);

  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    title: String(raw.title ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    courseId: String(raw.courseId ?? ""),
    courseTitle: raw.courseTitle ? String(raw.courseTitle) : undefined,
    quizKind: raw.quizKind as Quiz["quizKind"],
    lessonId: raw.lessonId ? String(raw.lessonId) : undefined,
    instructions: raw.instructions ? String(raw.instructions) : undefined,
    durationMinutes: Number(raw.durationMinutes ?? 30),
    totalMarks: Number(raw.totalMarks ?? totalMarks),
    passingMarks: Math.ceil((Number(raw.totalMarks ?? totalMarks) * passingPercentage) / 100),
    passingPercentage,
    maxAttempts: Number(raw.maxAttempts ?? 3),
    shuffleQuestions: Boolean(raw.shuffleQuestions ?? true),
    shuffleOptions: Boolean(raw.shuffleOptions ?? true),
    showResultsInstantly: raw.showResultsInstantly !== false,
    issueCertificateOnPass: raw.issueCertificateOnPass !== false,
    certificateTemplate: (raw.certificateTemplate as Quiz["certificateTemplate"]) ?? "classic-maroon",
    enableProctoring: Boolean(raw.enableProctoring ?? true),
    maxProctorViolations: Number(raw.maxProctorViolations ?? 3),
    autoSubmitOnProctorViolation: Boolean(raw.autoSubmitOnProctorViolation ?? true),
    requireFullscreen: Boolean(raw.requireFullscreen ?? false),
    questionItems,
    questions: Number(raw.questions ?? questionItems.length),
    attempts: Number(raw.attempts ?? 0),
    status: (raw.status as Quiz["status"]) ?? "draft",
  };
}

export function stripAnswersForStudent(quiz: Quiz): Omit<Quiz, "questionItems"> & {
  questionItems: Omit<ExamQuestion, "correctOptionIds" | "explanation">[];
} {
  return {
    ...quiz,
    questionItems: quiz.questionItems.map(({ correctOptionIds, explanation, ...q }) => q),
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function prepareExamQuestions(quiz: Quiz): ExamQuestion[] {
  let questions = [...quiz.questionItems].sort((a, b) => a.order - b.order);
  if (quiz.shuffleQuestions) questions = shuffle(questions);
  if (quiz.shuffleOptions) {
    questions = questions.map((q) => ({ ...q, options: shuffle(q.options) }));
  }
  return questions;
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export function gradeAnswer(question: ExamQuestion, selected: string[]) {
  const correct = arraysEqual(selected, question.correctOptionIds);
  let marksAwarded = 0;
  if (correct) {
    marksAwarded = question.marks;
  } else if (selected.length > 0 && question.negativeMarks) {
    marksAwarded = -question.negativeMarks;
  }
  return {
    correct,
    marksAwarded,
    correctOptionIds: question.correctOptionIds,
    explanation: question.explanation,
  };
}

export function gradeExam(
  questions: ExamQuestion[],
  answers: Record<string, string[]>,
) {
  const questionResults = questions.map((q) => {
    const selected = answers[q.id] ?? [];
    const result = gradeAnswer(q, selected);
    return {
      questionId: q.id,
      selectedOptionIds: selected,
      ...result,
    };
  });

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const score = Math.max(0, questionResults.reduce((s, r) => s + r.marksAwarded, 0));
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return { questionResults, score, totalMarks, percentage };
}

export function generateCertificateNo() {
  const year = new Date().getFullYear();
  const rand = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `NBG-CERT-${year}-${rand}`;
}

export async function buildCertificate(params: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  quizTitle: string;
  quizId: string;
  attemptId: string;
  score: number;
  percentage: number;
  verifyBaseUrl: string;
  template?: Certificate["template"];
}): Promise<Certificate> {
  const now = new Date().toISOString();
  const certificateNo = generateCertificateNo();
  const verifyUrl = `${params.verifyBaseUrl}/certificates/verify/${certificateNo}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 256,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return {
    id: randomUUID(),
    certificateNo,
    studentId: params.studentId,
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    courseTitle: params.courseTitle,
    quizTitle: params.quizTitle,
    quizId: params.quizId,
    attemptId: params.attemptId,
    score: params.score,
    percentage: params.percentage,
    issuedAt: now,
    verifyUrl,
    qrCodeDataUrl,
    template: params.template ?? "classic-maroon",
    status: "issued",
    createdAt: now,
    updatedAt: now,
  };
}

export { defaultQuestion } from "@/lib/exam/question-utils";

export function normalizeCertificate(raw: Record<string, unknown>): Certificate {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    certificateNo: String(raw.certificateNo ?? ""),
    studentId: String(raw.studentId ?? ""),
    studentName: String(raw.studentName ?? ""),
    studentEmail: raw.studentEmail ? String(raw.studentEmail) : undefined,
    courseTitle: String(raw.courseTitle ?? ""),
    quizTitle: String(raw.quizTitle ?? raw.courseTitle ?? ""),
    quizId: String(raw.quizId ?? ""),
    attemptId: String(raw.attemptId ?? ""),
    score: Number(raw.score ?? 0),
    percentage: Number(raw.percentage ?? 0),
    issuedAt: String(raw.issuedAt ?? raw.createdAt ?? ""),
    verifyUrl: String(raw.verifyUrl ?? ""),
    qrCodeDataUrl: raw.qrCodeDataUrl ? String(raw.qrCodeDataUrl) : undefined,
    template: (raw.template as Certificate["template"]) ?? "classic-maroon",
    status: (raw.status as Certificate["status"]) ?? "issued",
  };
}

export function normalizeAttempt(raw: Record<string, unknown>): QuizAttempt {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    quizId: String(raw.quizId ?? ""),
    quizTitle: String(raw.quizTitle ?? ""),
    studentId: String(raw.studentId ?? ""),
    studentName: String(raw.studentName ?? ""),
    studentEmail: String(raw.studentEmail ?? ""),
    startedAt: String(raw.startedAt ?? ""),
    submittedAt: raw.submittedAt ? String(raw.submittedAt) : undefined,
    answers: (raw.answers as Record<string, string[]>) ?? {},
    score: Number(raw.score ?? 0),
    totalMarks: Number(raw.totalMarks ?? 0),
    percentage: Number(raw.percentage ?? 0),
    passed: Boolean(raw.passed),
    timeTakenSeconds: Number(raw.timeTakenSeconds ?? 0),
    status: (raw.status as QuizAttempt["status"]) ?? "in_progress",
    certificateId: raw.certificateId ? String(raw.certificateId) : undefined,
    tabSwitchCount: Number(raw.tabSwitchCount ?? 0),
    proctoringViolations: Array.isArray(raw.proctoringViolations)
      ? (raw.proctoringViolations as QuizAttempt["proctoringViolations"])
      : [],
    autoSubmittedByProctor: Boolean(raw.autoSubmittedByProctor),
    questionResults: raw.questionResults as QuizAttempt["questionResults"],
  };
}
