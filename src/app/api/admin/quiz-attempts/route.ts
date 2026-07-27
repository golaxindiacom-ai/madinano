import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  getQuizAttemptStats,
  listQuizAttempts,
  listQuizzesForAttempts,
  listStudentsForAttempts,
} from "@/lib/admin/exam-attempt-service";
import type { QuizAttempt } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getQuizAttemptStats());
    }
    if (searchParams.get("quizzes") === "true") {
      return jsonOk(await listQuizzesForAttempts());
    }
    if (searchParams.get("students") === "true") {
      return jsonOk(await listStudentsForAttempts());
    }

    const attempts = await listQuizAttempts({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as QuizAttempt["status"] | "all") ?? "all",
      result: (searchParams.get("result") as "all" | "passed" | "failed" | "in_progress") ?? "all",
      quizId: searchParams.get("quizId") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
      hasViolations: searchParams.get("violations") === "true",
    });
    return jsonOk(attempts);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list attempts", 500);
  }
}
