import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { deleteQuizAttempt, getQuizAttemptDetail } from "@/lib/admin/exam-attempt-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getQuizAttemptDetail(id);
    if (!detail) return jsonError("Attempt not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load attempt", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteQuizAttempt(id);
    if (!ok) return jsonError("Attempt not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete attempt", 400);
  }
}
