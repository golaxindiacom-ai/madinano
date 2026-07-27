import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import { normalizeCourse, normalizeLesson } from "./course-builder";
import { normalizeQuiz } from "./exam-engine";
import { parseYoutubeVideoId } from "./youtube";
import type {
  AdminDatabase,
  Course,
  Lesson,
  LessonDetailPayload,
  LessonInput,
  LessonListItem,
  LessonStats,
} from "./types";

const now = () => new Date().toISOString();

function getSectionTitle(course: Course, sectionId: string) {
  return course.curriculum.find((s) => s.id === sectionId)?.title ?? "—";
}

function enrichLesson(db: AdminDatabase, lesson: Lesson): LessonListItem {
  const courseRaw = db.courses.find((c) => c.id === lesson.courseId);
  const course = courseRaw
    ? normalizeCourse(courseRaw as unknown as Record<string, unknown>)
    : null;
  const instructor = course
    ? db.instructors.find((i) => i.id === course.instructorId)
    : undefined;
  const quiz = lesson.quizId
    ? db.quizzes.find((q) => q.id === lesson.quizId)
    : undefined;

  return {
    ...lesson,
    courseTitle: course?.title ?? "Unknown course",
    sectionTitle: course ? getSectionTitle(course, lesson.sectionId) : "—",
    quizTitle: quiz?.title,
    instructorName: instructor?.name ?? "—",
  };
}

function validateInput(input: LessonInput, db: AdminDatabase, selfId?: string): string | null {
  if (!input.title?.trim()) return "Lesson title is required";
  if (!input.courseId) return "Course is required";
  if (!input.sectionId) return "Section is required";
  if (!input.duration?.trim()) return "Duration is required";
  if (!["published", "draft"].includes(input.status)) return "Invalid status";
  if (!["video", "text", "quiz", "assignment"].includes(input.lessonType)) return "Invalid lesson type";

  const courseRaw = db.courses.find((c) => c.id === input.courseId);
  if (!courseRaw) return "Course not found";
  const course = normalizeCourse(courseRaw as unknown as Record<string, unknown>);
  const section = course.curriculum.find((s) => s.id === input.sectionId);
  if (!section) return "Section not found in selected course";

  if (input.lessonType === "video" && !input.videoUrl?.trim()) {
    return "YouTube URL is required for video lessons";
  }
  if (input.lessonType === "video" && input.videoUrl && !parseYoutubeVideoId(input.videoUrl)) {
    return "Invalid YouTube URL";
  }
  if (input.lessonType === "quiz" && !input.quizId) {
    return "Quiz is required for quiz lessons";
  }
  if (input.lessonType === "quiz" && input.quizId) {
    const quiz = db.quizzes.find((q) => q.id === input.quizId);
    if (!quiz) return "Selected quiz not found";
  }
  if (input.lessonType !== "quiz" && input.quizId) {
    return "Quiz can only be linked to quiz-type lessons";
  }

  if (selfId) {
    const existing = db.lessons.find((l) => l.id === selfId);
    if (!existing) return "Lesson not found";
  }

  return null;
}

function syncLessonQuizLink(db: AdminDatabase, lesson: Lesson, previousQuizId?: string) {
  if (previousQuizId && previousQuizId !== lesson.quizId) {
    const prevIdx = db.quizzes.findIndex((q) => q.id === previousQuizId);
    if (prevIdx !== -1 && db.quizzes[prevIdx].lessonId === lesson.id) {
      db.quizzes[prevIdx] = {
        ...db.quizzes[prevIdx],
        lessonId: undefined,
        updatedAt: now(),
      };
    }
  }

  if (lesson.quizId) {
    const quizIdx = db.quizzes.findIndex((q) => q.id === lesson.quizId);
    if (quizIdx !== -1) {
      db.quizzes[quizIdx] = {
        ...db.quizzes[quizIdx],
        lessonId: lesson.id,
        courseId: lesson.courseId,
        quizKind: db.quizzes[quizIdx].quizKind ?? "lesson_quiz",
        updatedAt: now(),
      };
    }
  }
}

function buildLessonFromInput(input: LessonInput, id: string, ts: string): Lesson {
  const videoId =
    input.lessonType === "video" && input.videoUrl
      ? parseYoutubeVideoId(input.videoUrl)
      : null;

  return {
    id,
    title: input.title.trim(),
    courseId: input.courseId,
    sectionId: input.sectionId,
    description: input.description?.trim() || undefined,
    duration: input.duration.trim(),
    order: Number(input.order ?? 0),
    status: input.status,
    lessonType: input.lessonType,
    content: input.lessonType === "text" ? input.content?.trim() || undefined : undefined,
    videoProvider: input.lessonType === "video" ? "youtube" : undefined,
    videoUrl: input.lessonType === "video" ? input.videoUrl?.trim() : undefined,
    videoId: videoId ?? undefined,
    isPrivateVideo: input.lessonType === "video" ? Boolean(input.isPrivateVideo) : undefined,
    quizId: input.lessonType === "quiz" ? input.quizId : undefined,
    createdAt: ts,
    updatedAt: ts,
  };
}

export type ListLessonsOptions = {
  search?: string;
  status?: Lesson["status"] | "all";
  lessonType?: Lesson["lessonType"] | "all";
  courseId?: string;
};

export async function getLessonStats(): Promise<LessonStats> {
  const db = await readDb();
  const lessons = db.lessons.map((l) => normalizeLesson(l as unknown as Record<string, unknown>));
  const courseIds = new Set(lessons.map((l) => l.courseId));

  return {
    total: lessons.length,
    published: lessons.filter((l) => l.status === "published").length,
    draft: lessons.filter((l) => l.status === "draft").length,
    video: lessons.filter((l) => l.lessonType === "video").length,
    text: lessons.filter((l) => l.lessonType === "text").length,
    quiz: lessons.filter((l) => l.lessonType === "quiz").length,
    assignment: lessons.filter((l) => l.lessonType === "assignment").length,
    coursesWithLessons: courseIds.size,
  };
}

export async function listLessons(options: ListLessonsOptions = {}): Promise<LessonListItem[]> {
  const db = await readDb();
  let lessons = db.lessons.map((l) =>
    normalizeLesson(l as unknown as Record<string, unknown>),
  );

  if (options.status && options.status !== "all") {
    lessons = lessons.filter((l) => l.status === options.status);
  }
  if (options.lessonType && options.lessonType !== "all") {
    lessons = lessons.filter((l) => l.lessonType === options.lessonType);
  }
  if (options.courseId) {
    lessons = lessons.filter((l) => l.courseId === options.courseId);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    lessons = lessons.filter((l) => {
      const enriched = enrichLesson(db, l);
      return [l.title, l.description, enriched.courseTitle, enriched.sectionTitle, enriched.instructorName].some(
        (v) => String(v ?? "").toLowerCase().includes(q),
      );
    });
  }

  return lessons
    .map((l) => enrichLesson(db, l))
    .sort((a, b) => {
      const courseCmp = a.courseTitle.localeCompare(b.courseTitle);
      if (courseCmp !== 0) return courseCmp;
      if (a.sectionId !== b.sectionId) return a.order - b.order;
      return a.order - b.order;
    });
}

export async function getLessonDetail(id: string): Promise<LessonDetailPayload | null> {
  const db = await readDb();
  const raw = db.lessons.find((l) => l.id === id);
  if (!raw) return null;

  const lesson = normalizeLesson(raw as unknown as Record<string, unknown>);
  const enriched = enrichLesson(db, lesson);
  const quizRaw = lesson.quizId ? db.quizzes.find((q) => q.id === lesson.quizId) : undefined;

  return {
    lesson,
    courseTitle: enriched.courseTitle,
    sectionTitle: enriched.sectionTitle,
    instructorName: enriched.instructorName,
    quiz: quizRaw
      ? normalizeQuiz(quizRaw as unknown as Record<string, unknown>)
      : null,
  };
}

export async function createLesson(input: LessonInput): Promise<LessonListItem> {
  const db = await readDb();
  const err = validateInput(input, db);
  if (err) throw new Error(err);

  const ts = now();
  const id = randomUUID();

  if (!input.order) {
    const sectionLessons = db.lessons.filter(
      (l) => l.courseId === input.courseId && l.sectionId === input.sectionId,
    );
    input.order = sectionLessons.length + 1;
  }

  const lesson = buildLessonFromInput(input, id, ts);
  db.lessons.unshift(lesson);
  syncLessonQuizLink(db, lesson);
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichLesson(dbFresh, lesson);
}

export async function updateLesson(id: string, input: LessonInput): Promise<LessonListItem | null> {
  const db = await readDb();
  const idx = db.lessons.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const err = validateInput(input, db, id);
  if (err) throw new Error(err);

  const existing = normalizeLesson(db.lessons[idx] as unknown as Record<string, unknown>);
  const previousQuizId = existing.quizId;
  const ts = now();

  const lesson: Lesson = {
    ...buildLessonFromInput(input, id, ts),
    createdAt: existing.createdAt,
    updatedAt: ts,
  };

  db.lessons[idx] = lesson;
  syncLessonQuizLink(db, lesson, previousQuizId);
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichLesson(dbFresh, lesson);
}

export async function updateLessonStatus(
  id: string,
  status: Lesson["status"],
): Promise<Lesson | null> {
  const db = await readDb();
  const idx = db.lessons.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  db.lessons[idx] = {
    ...db.lessons[idx],
    status,
    updatedAt: now(),
  };
  await writeDb(db);
  return normalizeLesson(db.lessons[idx] as unknown as Record<string, unknown>);
}

export async function deleteLesson(id: string): Promise<boolean> {
  const db = await readDb();
  const lessonRaw = db.lessons.find((l) => l.id === id);
  if (!lessonRaw) return false;

  const lesson = normalizeLesson(lessonRaw as unknown as Record<string, unknown>);

  if (lesson.quizId) {
    const quizIdx = db.quizzes.findIndex((q) => q.id === lesson.quizId);
    if (quizIdx !== -1 && db.quizzes[quizIdx].lessonId === id) {
      db.quizzes[quizIdx] = {
        ...db.quizzes[quizIdx],
        lessonId: undefined,
        updatedAt: now(),
      };
    }
  }

  db.lessons = db.lessons.filter((l) => l.id !== id);
  await writeDb(db);
  return true;
}

export async function listCoursesForLessons() {
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
