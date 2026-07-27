import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteQuizFull,
  getQuizAdminDetail,
  updateQuizStatus,
} from "@/lib/admin/quiz-service";
import type { Quiz } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getQuizAdminDetail(id);
    if (!detail) return jsonError("Quiz not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load quiz", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.status) {
      const quiz = await updateQuizStatus(id, body.status as Quiz["status"]);
      if (!quiz) return jsonError("Quiz not found", 404);
      return jsonOk(quiz);
    }
    return jsonError("Nothing to update", 400);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update quiz", 400);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const ok = await deleteQuizFull(id, force);
    if (!ok) return jsonError("Quiz not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete quiz", 400);
  }
}
