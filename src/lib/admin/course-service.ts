import { readDb, writeDb } from "./db";
import { getCourseFull, normalizeCourse } from "./course-builder";
import { recomputeInstructorStats } from "./instructor-service";
import { recomputeCategoryCourseCounts } from "./category-service";
import type { Course, CourseAdminDetail, CourseListItem, CourseStats } from "./types";

export type ListCoursesOptions = {
  search?: string;
  status?: Course["status"] | "all";
  mode?: Course["mode"] | "all";
  instructorId?: string;
};

export async function getCourseStats(): Promise<CourseStats> {
  const db = await readDb();
  const courses = db.courses.map((c) => normalizeCourse(c as unknown as Record<string, unknown>));
  const enrollments = db.enrollments ?? [];
  return {
    total: courses.length,
    published: courses.filter((c) => c.status === "published").length,
    draft: courses.filter((c) => c.status === "draft").length,
    archived: courses.filter((c) => c.status === "archived").length,
    totalEnrollments: enrollments.filter((e) => e.status !== "dropped").length,
  };
}

export async function listCourses(options: ListCoursesOptions = {}): Promise<CourseListItem[]> {
  const db = await readDb();
  let courses = db.courses.map((c) => normalizeCourse(c as unknown as Record<string, unknown>));

  if (options.status && options.status !== "all") {
    courses = courses.filter((c) => c.status === options.status);
  }
  if (options.mode && options.mode !== "all") {
    courses = courses.filter((c) => c.mode === options.mode);
  }
  if (options.instructorId) {
    courses = courses.filter((c) => c.instructorId === options.instructorId);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    courses = courses.filter((c) =>
      [c.title, c.description, c.shortDescription, c.duration, c.level].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }

  return courses
    .map((course) => {
      const instructor = db.instructors.find((i) => i.id === course.instructorId);
      const lessons = db.lessons.filter((l) => l.courseId === course.id);
      const liveClasses = db.liveClasses.filter((l) => l.courseId === course.id);
      const activeEnrollments = (db.enrollments ?? []).filter(
        (e) => e.courseId === course.id && e.status !== "dropped",
      ).length;

      return {
        ...course,
        enrollments: activeEnrollments,
        instructorName: instructor?.name ?? "—",
        lessonCount: lessons.length,
        sectionCount: course.curriculum.length,
        liveClassCount: liveClasses.length,
        hasFinalExam: Boolean(course.finalExamQuizId),
        activeEnrollments,
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getCourseAdminDetail(courseId: string): Promise<CourseAdminDetail | null> {
  const full = await getCourseFull(courseId);
  if (!full) return null;

  const db = await readDb();
  const instructor = db.instructors.find((i) => i.id === full.course.instructorId);
  const enrollments = (db.enrollments ?? []).filter((e) => e.courseId === courseId);
  const activeEnrollments = enrollments.filter((e) => e.status !== "dropped").length;

  return {
    ...full,
    instructorName: instructor?.name ?? "—",
    instructorEmail: instructor?.email,
    enrollments,
    activeEnrollments,
  };
}

export async function updateCourseStatus(
  courseId: string,
  status: Course["status"],
): Promise<Course | null> {
  const db = await readDb();
  const idx = db.courses.findIndex((c) => c.id === courseId);
  if (idx === -1) return null;

  db.courses[idx] = {
    ...db.courses[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(db);
  return normalizeCourse(db.courses[idx] as unknown as Record<string, unknown>);
}

export async function deleteCourseFull(courseId: string): Promise<boolean> {
  const db = await readDb();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) return false;

  const quizIds = db.quizzes.filter((q) => q.courseId === courseId).map((q) => q.id);

  db.courses = db.courses.filter((c) => c.id !== courseId);
  db.lessons = db.lessons.filter((l) => l.courseId !== courseId);
  db.liveClasses = db.liveClasses.filter((l) => l.courseId !== courseId);
  db.quizzes = db.quizzes.filter((q) => q.courseId !== courseId);
  db.enrollments = (db.enrollments ?? []).filter((e) => e.courseId !== courseId);

  const assignmentIds = db.assignments.filter((a) => a.courseId === courseId).map((a) => a.id);
  db.assignments = db.assignments.filter((a) => a.courseId !== courseId);
  db.assignmentSubmissions = (db.assignmentSubmissions ?? []).filter(
    (s) => !assignmentIds.includes(s.assignmentId),
  );

  const attemptIds = db.quizAttempts
    .filter((a) => quizIds.includes(a.quizId))
    .map((a) => a.id);
  db.quizAttempts = db.quizAttempts.filter((a) => !quizIds.includes(a.quizId));
  db.certificates = db.certificates.filter((c) => !attemptIds.includes(c.attemptId));

  recomputeInstructorStats(db);
  recomputeCategoryCourseCounts(db);
  await writeDb(db);
  return true;
}
