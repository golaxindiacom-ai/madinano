import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  getQuizStats,
  listCoursesForQuizzes,
  listInstructorsForQuizzes,
  listQuizzes,
} from "@/lib/admin/quiz-service";
import type { Quiz, QuizKind } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getQuizStats());
    }
    if (searchParams.get("courses") === "true") {
      return jsonOk(await listCoursesForQuizzes());
    }
    if (searchParams.get("instructors") === "true") {
      return jsonOk(await listInstructorsForQuizzes());
    }

    const quizzes = await listQuizzes({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as Quiz["status"] | "all") ?? "all",
      quizKind: (searchParams.get("kind") as QuizKind | "library" | "all") ?? "all",
      courseId: searchParams.get("courseId") ?? undefined,
      instructorId: searchParams.get("instructorId") ?? undefined,
    });
    return jsonOk(quizzes);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list quizzes", 500);
  }
}
