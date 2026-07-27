import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { createQuizFull } from "@/lib/admin/quiz-builder";
import type { QuizBuilderInput } from "@/lib/admin/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuizBuilderInput;
    if (!body.title?.trim()) return jsonError("Exam title is required");
    if (!body.questionItems?.length) return jsonError("Add at least one question");

    const quiz = await createQuizFull(body);
    return jsonOk(quiz, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create exam", 500);
  }
}
