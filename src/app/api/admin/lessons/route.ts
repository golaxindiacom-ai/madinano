import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  createLesson,
  getLessonStats,
  listCoursesForLessons,
  listLessons,
} from "@/lib/admin/lesson-service";
import type { LessonInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getLessonStats());
    }
    if (searchParams.get("courses") === "true") {
      return jsonOk(await listCoursesForLessons());
    }
    const lessons = await listLessons({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as LessonInput["status"] | "all") ?? "all",
      lessonType: (searchParams.get("type") as LessonInput["lessonType"] | "all") ?? "all",
      courseId: searchParams.get("courseId") ?? undefined,
    });
    return jsonOk(lessons);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list lessons", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LessonInput;
    const lesson = await createLesson(body);
    return jsonOk(lesson, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create lesson", 400);
  }
}
