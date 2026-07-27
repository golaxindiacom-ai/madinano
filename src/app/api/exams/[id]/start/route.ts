import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { startExamAttempt } from "@/lib/admin/exam-service";
import { getAuthUser } from "@/lib/auth/auth-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return jsonError("Please login to take exams", 401);

    const user = await getAuthUser(userId);
    if (!user) return jsonError("Please login to take exams", 401);

    const { id } = await params;
    const student = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const result = await startExamAttempt(id, student);
    if (!result) return jsonError("Exam not found", 404);
    if ("error" in result) return jsonError(String(result.error), 403);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to start exam", 500);
  }
}
