import { readDb } from "./db";
import { getCourseFull, normalizeCourse } from "./course-builder";
import { normalizeQuiz } from "./exam-engine";
import type { CourseLearnPayload, Lesson, Quiz } from "./types";

export async function getCourseLearn(courseId: string): Promise<CourseLearnPayload | null> {
  const full = await getCourseFull(courseId);
  if (!full) return null;

  const course = full.course;
  if (course.status !== "published") return null;

  const db = await readDb();
  const instructor = db.instructors.find((i) => i.id === course.instructorId);

  const lessons = full.lessons
    .filter((l) => l.status === "published")
    .map((lesson) => enrichLesson(lesson, full.lessonQuizzes[lesson.id]));

  const finalExam = full.finalExam?.status === "active" ? summarizeQuiz(full.finalExam) : null;

  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      duration: course.duration,
      level: course.level,
      instructorName: instructor?.name ?? "Instructor",
      curriculum: course.curriculum,
    },
    lessons,
    finalExam,
  };
}

function enrichLesson(lesson: Lesson, quiz: Quiz | undefined) {
  return {
    id: lesson.id,
    sectionId: lesson.sectionId,
    title: lesson.title,
    description: lesson.description,
    duration: lesson.duration,
    order: lesson.order,
    lessonType: lesson.lessonType,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    videoId: lesson.videoId,
    isPrivateVideo: lesson.isPrivateVideo,
    quizId: lesson.quizId,
    quiz: quiz?.status === "active" ? summarizeQuiz(quiz) : null,
  };
}

function summarizeQuiz(quiz: Quiz) {
  return {
    id: quiz.id,
    title: quiz.title,
    durationMinutes: quiz.durationMinutes,
    totalMarks: quiz.totalMarks,
    passingPercentage: quiz.passingPercentage,
    questions: quiz.questions,
    maxAttempts: quiz.maxAttempts,
    quizKind: quiz.quizKind,
  };
}

export async function listPublishedCourses() {
  const db = await readDb();
  return db.courses
    .filter((c) => c.status === "published")
    .map((c) => normalizeCourse(c as unknown as Record<string, unknown>))
    .map((c) => ({
      id: c.id,
      title: c.title,
      shortDescription: c.shortDescription,
      sellingPrice: c.sellingPrice,
      duration: c.duration,
      level: c.level,
    }));
}
