import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getQuizFull, updateQuizFull } from "@/lib/admin/quiz-builder";
import type { QuizBuilderInput } from "@/lib/admin/types";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const quiz = await getQuizFull(id);
  if (!quiz) return jsonError("Exam not found", 404);
  return jsonOk(quiz);
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = (await request.json()) as QuizBuilderInput;
    const quiz = await updateQuizFull(id, body);
    if (!quiz) return jsonError("Exam not found", 404);
    return jsonOk(quiz);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update exam", 500);
  }
}
