import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getCourseLearn } from "@/lib/admin/course-learn";
import { readDb } from "@/lib/admin/db";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const data = await getCourseLearn(id);
  if (!data) return jsonError("Course not found or not published", 404);

  const userId = getSessionUserIdFromRequest(request);
  const db = await readDb();
  const enrolled = userId
    ? (db.enrollments ?? []).some(
        (e) => e.userId === userId && e.courseId === id && e.status !== "dropped",
      )
    : false;

  if (!enrolled) {
    const previewLessons = data.lessons.slice(0, 1).map((lesson) => ({
      ...lesson,
      videoUrl: lesson.isPrivateVideo ? undefined : lesson.videoUrl,
      content: lesson.lessonType === "video" && lesson.isPrivateVideo ? undefined : lesson.content,
      quiz: null,
    }));

    return jsonOk({
      ...data,
      lessons: previewLessons,
      finalExam: null,
      access: {
        enrolled: false,
        preview: true,
        message: "Enroll in this course to unlock full lessons, videos, and exams.",
      },
    });
  }

  return jsonOk({
    ...data,
    access: { enrolled: true, preview: false },
  });
}
