import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import { syncCourseQuizzes } from "./course-quiz-sync";
import { recomputeInstructorStats } from "./instructor-service";
import { normalizeQuiz } from "./exam-engine";
import { parseYoutubeVideoId } from "./youtube";
import { resolveCourseCategoryIds } from "./categories";
import { recomputeCategoryCourseCounts } from "./category-service";
import type {
  Course,
  CourseBuilderInput,
  CourseBuilderLessonInput,
  CourseFullPayload,
  Lesson,
  LiveClass,
  CourseMode,
  CurriculumSection,
  Quiz,
} from "./types";

const now = () => new Date().toISOString();

export function normalizeCourse(raw: Record<string, unknown>): Course {
  const legacyPrice = Number(raw.price ?? 0);
  const sellingPrice = Number(raw.sellingPrice ?? legacyPrice);
  const originalPrice = Number(raw.originalPrice ?? legacyPrice);
  const categoryId = String(raw.categoryId ?? raw.mainCategoryId ?? "");

  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    title: String(raw.title ?? ""),
    shortDescription: raw.shortDescription ? String(raw.shortDescription) : undefined,
    description: String(raw.description ?? ""),
    mainCategoryId: String(raw.mainCategoryId ?? categoryId),
    subCategoryId: raw.subCategoryId ? String(raw.subCategoryId) : undefined,
    subSubCategoryId: raw.subSubCategoryId ? String(raw.subSubCategoryId) : undefined,
    categoryId,
    instructorId: String(raw.instructorId ?? ""),
    originalPrice,
    sellingPrice,
    price: sellingPrice,
    enrollments: Number(raw.enrollments ?? 0),
    rating: Number(raw.rating ?? 0),
    status: (raw.status as Course["status"]) ?? "draft",
    level: (raw.level as Course["level"]) ?? "beginner",
    mode: (raw.mode as CourseMode) ?? "recorded",
    duration: String(raw.duration ?? ""),
    language: raw.language ? String(raw.language) : undefined,
    requirements: Array.isArray(raw.requirements) ? (raw.requirements as string[]) : [],
    outcomes: Array.isArray(raw.outcomes) ? (raw.outcomes as string[]) : [],
    thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl) : undefined,
    curriculum: Array.isArray(raw.curriculum) ? (raw.curriculum as CurriculumSection[]) : [],
    finalExamQuizId: raw.finalExamQuizId ? String(raw.finalExamQuizId) : undefined,
  };
}

export function normalizeLesson(raw: Record<string, unknown>): Lesson {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    title: String(raw.title ?? ""),
    courseId: String(raw.courseId ?? ""),
    sectionId: String(raw.sectionId ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    duration: String(raw.duration ?? ""),
    order: Number(raw.order ?? 0),
    status: (raw.status as Lesson["status"]) ?? "draft",
    lessonType: (raw.lessonType as Lesson["lessonType"]) ?? "video",
    content: raw.content ? String(raw.content) : undefined,
    videoProvider: raw.videoProvider as Lesson["videoProvider"],
    videoUrl: raw.videoUrl ? String(raw.videoUrl) : undefined,
    videoId: raw.videoId ? String(raw.videoId) : undefined,
    isPrivateVideo: Boolean(raw.isPrivateVideo),
    quizId: raw.quizId ? String(raw.quizId) : undefined,
  };
}

export function normalizeLiveClass(raw: Record<string, unknown>): LiveClass {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    title: String(raw.title ?? ""),
    courseId: raw.courseId ? String(raw.courseId) : undefined,
    sectionId: raw.sectionId ? String(raw.sectionId) : undefined,
    instructorName: String(raw.instructorName ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    scheduledAt: String(raw.scheduledAt ?? ""),
    duration: String(raw.duration ?? ""),
    enrolled: Number(raw.enrolled ?? 0),
    status: (raw.status as LiveClass["status"]) ?? "scheduled",
    platform: (raw.platform as LiveClass["platform"]) ?? "google_meet",
    meetingUrl: raw.meetingUrl ? String(raw.meetingUrl) : undefined,
    meetingId: raw.meetingId ? String(raw.meetingId) : undefined,
    passcode: raw.passcode ? String(raw.passcode) : undefined,
    youtubeLiveUrl: raw.youtubeLiveUrl ? String(raw.youtubeLiveUrl) : undefined,
  };
}

export async function getCourseFull(courseId: string): Promise<CourseFullPayload | null> {
  const db = await readDb();
  const raw = db.courses.find((c) => c.id === courseId);
  if (!raw) return null;

  const course = normalizeCourse(raw as unknown as Record<string, unknown>);
  const lessons = db.lessons
    .filter((l) => l.courseId === courseId)
    .map((l) => normalizeLesson(l as unknown as Record<string, unknown>))
    .sort((a, b) => a.order - b.order);

  const liveClasses = db.liveClasses
    .filter((l) => l.courseId === courseId)
    .map((l) => normalizeLiveClass(l as unknown as Record<string, unknown>))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const courseQuizzes = db.quizzes
    .filter((q) => q.courseId === courseId)
    .map((q) => normalizeQuiz(q as unknown as Record<string, unknown>));

  const lessonQuizzes: Record<string, Quiz> = {};
  for (const q of courseQuizzes) {
    if (q.lessonId) lessonQuizzes[q.lessonId] = q;
  }

  const finalExam =
    courseQuizzes.find((q) => q.id === course.finalExamQuizId) ??
    courseQuizzes.find((q) => q.quizKind === "final_exam") ??
    null;

  return { course, lessons, liveClasses, lessonQuizzes, finalExam };
}

function buildLesson(courseId: string, input: CourseBuilderInput["lessons"][0], ts: string): Lesson {
  const videoId =
    input.videoProvider === "youtube" && input.videoUrl
      ? parseYoutubeVideoId(input.videoUrl)
      : null;

  return {
    id: input.id ?? randomUUID(),
    courseId,
    sectionId: input.sectionId,
    title: input.title,
    description: input.description,
    duration: input.duration,
    order: input.order,
    status: input.status,
    lessonType: input.lessonType,
    content: input.content,
    videoProvider: input.videoProvider,
    videoUrl: input.videoUrl,
    videoId: videoId ?? undefined,
    isPrivateVideo: input.isPrivateVideo,
    quizId: input.quizId,
    createdAt: ts,
    updatedAt: ts,
  };
}

function buildLiveClass(
  courseId: string,
  instructorName: string,
  input: CourseBuilderInput["liveClasses"][0],
  ts: string,
): LiveClass {
  return {
    id: input.id ?? randomUUID(),
    courseId,
    sectionId: input.sectionId,
    title: input.title,
    description: input.description,
    instructorName,
    scheduledAt: input.scheduledAt,
    duration: input.duration,
    enrolled: 0,
    status: input.status,
    platform: input.platform,
    meetingUrl: input.meetingUrl,
    meetingId: input.meetingId,
    passcode: input.passcode,
    youtubeLiveUrl: input.youtubeLiveUrl,
    createdAt: ts,
    updatedAt: ts,
  };
}

function resolveLessonInputs(lessons: CourseBuilderLessonInput[]): CourseBuilderLessonInput[] {
  return lessons.map((l) => ({ ...l, id: l.id ?? randomUUID() }));
}

function applyLessonQuizIds(
  lessons: CourseBuilderLessonInput[],
  lessonQuizIds: Record<string, string>,
): CourseBuilderLessonInput[] {
  return lessons.map((l) => ({
    ...l,
    quizId: l.lessonType === "quiz" ? lessonQuizIds[l.id!] ?? l.quizId : undefined,
    quiz: l.lessonType === "quiz" ? l.quiz : undefined,
  }));
}

export async function createCourseFull(input: CourseBuilderInput): Promise<CourseFullPayload> {
  const ts = now();
  const courseId = randomUUID();
  const db0 = await readDb();
  const instructor = db0.instructors.find((i) => i.id === input.instructorId);

  const categoryIds = resolveCourseCategoryIds(
    input.mainCategoryId,
    input.subCategoryId,
    input.subSubCategoryId,
  );

  const resolvedLessons = resolveLessonInputs(input.lessons);

  let course: Course = {
    id: courseId,
    title: input.title,
    shortDescription: input.shortDescription,
    description: input.description,
    ...categoryIds,
    instructorId: input.instructorId,
    originalPrice: input.originalPrice,
    sellingPrice: input.sellingPrice,
    price: input.sellingPrice,
    enrollments: 0,
    rating: 0,
    status: input.status,
    level: input.level,
    mode: input.mode,
    duration: input.duration,
    language: input.language,
    requirements: input.requirements ?? [],
    outcomes: input.outcomes ?? [],
    thumbnailUrl: input.thumbnailUrl,
    curriculum: input.curriculum,
    createdAt: ts,
    updatedAt: ts,
  };

  const { lessonQuizIds, finalExamQuizId } = await syncCourseQuizzes(
    course,
    resolvedLessons,
    input.finalExam,
  );

  course = { ...course, finalExamQuizId };

  const db = await readDb();
  const lessonsWithQuizzes = applyLessonQuizIds(resolvedLessons, lessonQuizIds);
  const lessons = lessonsWithQuizzes.map((l) => buildLesson(courseId, l, ts));
  const liveClasses = input.liveClasses.map((l) =>
    buildLiveClass(courseId, instructor?.name ?? "Instructor", l, ts),
  );

  db.courses.unshift(course);
  db.lessons.unshift(...lessons);
  db.liveClasses.unshift(...liveClasses);

  recomputeInstructorStats(db);
  recomputeCategoryCourseCounts(db);
  await writeDb(db);
  await logCourseAction("create", courseId, input.title);

  return (await getCourseFull(courseId))!;
}

export async function updateCourseFull(
  courseId: string,
  input: CourseBuilderInput,
): Promise<CourseFullPayload | null> {
  const db = await readDb();
  const idx = db.courses.findIndex((c) => c.id === courseId);
  if (idx === -1) return null;

  const ts = now();
  const existing = db.courses[idx];
  const instructor = db.instructors.find((i) => i.id === input.instructorId);

  const categoryIds = resolveCourseCategoryIds(
    input.mainCategoryId,
    input.subCategoryId,
    input.subSubCategoryId,
  );

  const course: Course = {
    ...existing,
    title: input.title,
    shortDescription: input.shortDescription,
    description: input.description,
    ...categoryIds,
    instructorId: input.instructorId,
    originalPrice: input.originalPrice,
    sellingPrice: input.sellingPrice,
    price: input.sellingPrice,
    status: input.status,
    level: input.level,
    mode: input.mode,
    duration: input.duration,
    language: input.language,
    requirements: input.requirements ?? [],
    outcomes: input.outcomes ?? [],
    thumbnailUrl: input.thumbnailUrl,
    curriculum: input.curriculum,
    updatedAt: ts,
  };

  const resolvedLessons = resolveLessonInputs(input.lessons);

  const { lessonQuizIds, finalExamQuizId } = await syncCourseQuizzes(
    { ...course, finalExamQuizId: existing.finalExamQuizId },
    resolvedLessons,
    input.finalExam,
  );

  const updatedCourse: Course = { ...course, finalExamQuizId };

  const dbFresh = await readDb();
  const courseIdxFresh = dbFresh.courses.findIndex((c) => c.id === courseId);
  if (courseIdxFresh === -1) return null;

  dbFresh.courses[courseIdxFresh] = updatedCourse;
  dbFresh.lessons = dbFresh.lessons.filter((l) => l.courseId !== courseId);
  dbFresh.liveClasses = dbFresh.liveClasses.filter((l) => l.courseId !== courseId);

  const lessonsWithQuizzes = applyLessonQuizIds(resolvedLessons, lessonQuizIds);
  const lessons = lessonsWithQuizzes.map((l) => buildLesson(courseId, l, ts));
  const liveClasses = input.liveClasses.map((l) =>
    buildLiveClass(courseId, instructor?.name ?? "Instructor", l, ts),
  );

  dbFresh.lessons.unshift(...lessons);
  dbFresh.liveClasses.unshift(...liveClasses);

  recomputeInstructorStats(dbFresh);
  recomputeCategoryCourseCounts(dbFresh);
  await writeDb(dbFresh);
  await logCourseAction("update", courseId, input.title);

  return getCourseFull(courseId);
}

async function logCourseAction(action: string, courseId: string, title: string) {
  const db = await readDb();
  const ts = now();
  db.systemLogs.unshift({
    id: randomUUID(),
    action: `${action} course "${title}" (${courseId})`,
    user: "admin@navbharatgurukulam.com",
    module: "courses",
    ip: "127.0.0.1",
    level: "info",
    createdAt: ts,
    updatedAt: ts,
  });
  if (db.systemLogs.length > 200) db.systemLogs = db.systemLogs.slice(0, 200);
  await writeDb(db);
}
