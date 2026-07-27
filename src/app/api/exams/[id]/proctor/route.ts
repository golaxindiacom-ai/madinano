import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { logProctorViolation } from "@/lib/admin/exam-service";
import type { ProctoringViolation } from "@/lib/admin/types";

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const attemptId = String(body.attemptId ?? "");
    const violation = body.violation as ProctoringViolation;
    if (!attemptId || !violation?.type) return jsonError("Invalid proctor payload");

    const result = await logProctorViolation(id, attemptId, violation);
    if (!result) return jsonError("Attempt not found", 404);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Proctor log failed", 500);
  }
}
