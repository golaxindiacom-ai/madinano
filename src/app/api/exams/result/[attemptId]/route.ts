import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getAttemptResult } from "@/lib/admin/exam-service";

type Props = { params: Promise<{ attemptId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { attemptId } = await params;
  const result = await getAttemptResult(attemptId);
  if (!result) return jsonError("Result not found", 404);
  return jsonOk(result);
}
