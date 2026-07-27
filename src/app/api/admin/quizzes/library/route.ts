import { jsonOk } from "@/lib/admin/api-utils";
import { listAvailableQuizzes } from "@/lib/admin/quiz-service";
import type { QuizKind } from "@/lib/admin/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as QuizKind | "any" | null;
  const instructorId = searchParams.get("instructorId") ?? undefined;
  const courseId = searchParams.get("courseId") ?? undefined;

  const items = await listAvailableQuizzes({
    kind: kind ?? "any",
    instructorId,
    courseId,
  });

  return jsonOk(items);
}
