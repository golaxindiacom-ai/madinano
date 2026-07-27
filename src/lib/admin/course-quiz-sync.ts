import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import { normalizeQuiz } from "./exam-engine";
import type {
  Course,
  CourseBuilderFinalExamInput,
  CourseBuilderLessonInput,
  ExamQuestion,
  Quiz,
} from "./types";

function buildQuestions(items: (Omit<ExamQuestion, "id"> & { id?: string })[]): ExamQuestion[] {
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

function upsertQuiz(
  db: Awaited<ReturnType<typeof readDb>>,
  existing: Quiz | undefined,
  patch: Omit<Quiz, "id" | "createdAt" | "updatedAt" | "questionItems" | "totalMarks" | "passingMarks" | "questions" | "attempts"> & {
    id?: string;
    questionItems: (Omit<ExamQuestion, "id"> & { id?: string })[];
  },
  ts: string,
): Quiz {
  const questionItems = buildQuestions(patch.questionItems);
  const totalMarks = questionItems.reduce((s, q) => s + q.marks, 0);
  const passingPercentage = patch.passingPercentage;

  const quiz: Quiz = {
    id: existing?.id ?? patch.id ?? randomUUID(),
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
    title: patch.title,
    description: patch.description,
    courseId: patch.courseId,
    courseTitle: patch.courseTitle,
    instructorId: patch.instructorId ?? existing?.instructorId,
    quizKind: patch.quizKind,
    lessonId: patch.lessonId,
    instructions: patch.instructions,
    durationMinutes: patch.durationMinutes,
    totalMarks,
    passingMarks: Math.ceil((totalMarks * passingPercentage) / 100),
    passingPercentage,
    maxAttempts: patch.maxAttempts,
    shuffleQuestions: patch.shuffleQuestions,
    shuffleOptions: patch.shuffleOptions,
    showResultsInstantly: patch.showResultsInstantly,
    issueCertificateOnPass: patch.issueCertificateOnPass,
    certificateTemplate: patch.certificateTemplate ?? existing?.certificateTemplate ?? "classic-maroon",
    enableProctoring: patch.enableProctoring,
    maxProctorViolations: patch.maxProctorViolations,
    autoSubmitOnProctorViolation: patch.autoSubmitOnProctorViolation,
    requireFullscreen: patch.requireFullscreen,
    questionItems,
    questions: questionItems.length,
    attempts: existing?.attempts ?? 0,
    status: patch.status,
  };

  const idx = db.quizzes.findIndex((q) => q.id === quiz.id);
  if (idx === -1) db.quizzes.unshift(quiz);
  else db.quizzes[idx] = quiz;

  return quiz;
}

function linkExistingQuiz(
  db: Awaited<ReturnType<typeof readDb>>,
  quizId: string,
  patch: {
    courseId: string;
    courseTitle: string;
    quizKind: Quiz["quizKind"];
    lessonId?: string;
    title?: string;
    status: Quiz["status"];
  },
  ts: string,
): Quiz | null {
  const raw = db.quizzes.find((q) => q.id === quizId);
  if (!raw) return null;

  const existing = normalizeQuiz(raw as unknown as Record<string, unknown>);
  const quiz: Quiz = {
    ...existing,
    courseId: patch.courseId,
    courseTitle: patch.courseTitle,
    quizKind: patch.quizKind,
    lessonId: patch.lessonId,
    title: patch.title?.trim() || existing.title,
    status: patch.status,
    updatedAt: ts,
  };

  const idx = db.quizzes.findIndex((q) => q.id === quiz.id);
  db.quizzes[idx] = quiz;
  return quiz;
}

function hasInlineQuestions(items?: (Omit<ExamQuestion, "id"> & { id?: string })[]): boolean {
  return Boolean(items?.some((q) => q.text.trim()));
}

export type SyncCourseQuizzesResult = {
  lessonQuizIds: Record<string, string>;
  finalExamQuizId?: string;
};

export async function syncCourseQuizzes(
  course: Course,
  lessons: CourseBuilderLessonInput[],
  finalExam: CourseBuilderFinalExamInput | undefined,
): Promise<SyncCourseQuizzesResult> {
  const db = await readDb();
  const ts = new Date().toISOString();
  const courseActive = course.status === "published";
  const lessonQuizIds: Record<string, string> = {};
  const keepQuizIds = new Set<string>();

  for (const lesson of lessons) {
    const lessonId = lesson.id;
    if (!lessonId || lesson.lessonType !== "quiz") continue;

    const inlineQuestions = hasInlineQuestions(lesson.quiz?.questionItems);

    if (lesson.quizId && !inlineQuestions) {
      const linked = linkExistingQuiz(db, lesson.quizId, {
        courseId: course.id,
        courseTitle: course.title,
        quizKind: "lesson_quiz",
        lessonId,
        title: lesson.title.trim() || undefined,
        status: courseActive && lesson.status === "published" ? "active" : "draft",
      }, ts);
      if (linked) {
        lessonQuizIds[lessonId] = linked.id;
        keepQuizIds.add(linked.id);
      }
      continue;
    }

    if (!lesson.quiz || !inlineQuestions) continue;

    const existing = db.quizzes.find(
      (q) =>
        q.id === lesson.quizId ||
        q.id === lesson.quiz?.id ||
        (q.lessonId === lessonId && q.courseId === course.id),
    );
    const normalized = existing
      ? normalizeQuiz(existing as unknown as Record<string, unknown>)
      : undefined;

    const quiz = upsertQuiz(
      db,
      normalized,
      {
        id: lesson.quizId ?? lesson.quiz.id ?? normalized?.id,
        title: lesson.title.trim() || "Lesson Quiz",
        courseId: course.id,
        courseTitle: course.title,
        quizKind: "lesson_quiz",
        lessonId,
        durationMinutes: lesson.quiz.durationMinutes || 10,
        passingPercentage: lesson.quiz.passingPercentage || 60,
        maxAttempts: lesson.quiz.maxAttempts || 5,
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultsInstantly: lesson.quiz.showResultsInstantly !== false,
        issueCertificateOnPass: false,
        enableProctoring: false,
        maxProctorViolations: 3,
        autoSubmitOnProctorViolation: false,
        requireFullscreen: false,
        questionItems: lesson.quiz.questionItems,
        status: courseActive && lesson.status === "published" ? "active" : "draft",
      },
      ts,
    );

    lessonQuizIds[lessonId] = quiz.id;
    keepQuizIds.add(quiz.id);
  }

  let finalExamQuizId: string | undefined;

  if (finalExam?.enabled) {
    const inlineFinalQuestions = hasInlineQuestions(finalExam.questionItems);

    if (finalExam.quizId && !inlineFinalQuestions) {
      const linked = linkExistingQuiz(db, finalExam.quizId, {
        courseId: course.id,
        courseTitle: course.title,
        quizKind: "final_exam",
        title: finalExam.title?.trim() || `${course.title} — Final Exam`,
        status: courseActive ? "active" : "draft",
      }, ts);
      if (linked) {
        finalExamQuizId = linked.id;
        keepQuizIds.add(linked.id);
      }
    } else if (inlineFinalQuestions) {
      const existing = db.quizzes.find(
        (q) =>
          q.id === finalExam.quizId ||
          q.id === course.finalExamQuizId ||
          (q.quizKind === "final_exam" && q.courseId === course.id),
      );
      const normalized = existing
        ? normalizeQuiz(existing as unknown as Record<string, unknown>)
        : undefined;

      const quiz = upsertQuiz(
        db,
        normalized,
        {
          id: finalExam.quizId ?? course.finalExamQuizId ?? normalized?.id,
          title: finalExam.title?.trim() || `${course.title} — Final Exam`,
          description: finalExam.description,
          courseId: course.id,
          courseTitle: course.title,
          quizKind: "final_exam",
          instructions: finalExam.instructions,
          durationMinutes: finalExam.durationMinutes || 45,
          passingPercentage: finalExam.passingPercentage || 60,
          maxAttempts: finalExam.maxAttempts || 3,
          shuffleQuestions: finalExam.shuffleQuestions !== false,
          shuffleOptions: finalExam.shuffleOptions !== false,
          showResultsInstantly: finalExam.showResultsInstantly !== false,
          issueCertificateOnPass: finalExam.issueCertificateOnPass !== false,
          certificateTemplate: finalExam.certificateTemplate ?? "classic-maroon",
          enableProctoring: finalExam.enableProctoring !== false,
          maxProctorViolations: finalExam.maxProctorViolations || 3,
          autoSubmitOnProctorViolation: finalExam.autoSubmitOnProctorViolation !== false,
          requireFullscreen: finalExam.requireFullscreen ?? false,
          questionItems: finalExam.questionItems,
          status: courseActive ? "active" : "draft",
        },
        ts,
      );

      finalExamQuizId = quiz.id;
      keepQuizIds.add(quiz.id);
    }
  } else if (course.finalExamQuizId) {
    db.quizzes = db.quizzes.filter((q) => q.id !== course.finalExamQuizId);
  }

  db.quizzes = db.quizzes.filter((q) => {
    if (q.courseId !== course.id) return true;
    if (q.quizKind === "lesson_quiz" && q.lessonId) {
      return keepQuizIds.has(q.id);
    }
    if (q.quizKind === "final_exam" || q.id === course.finalExamQuizId) {
      return keepQuizIds.has(q.id);
    }
    return true;
  });

  await writeDb(db);

  return { lessonQuizIds, finalExamQuizId };
}
