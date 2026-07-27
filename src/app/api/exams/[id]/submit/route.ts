import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { submitExam } from "@/lib/admin/exam-service";
import type { ExamSubmitInput } from "@/lib/admin/types";
import { getAuthUser } from "@/lib/auth/auth-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

function baseUrl(request: Request) {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function POST(request: Request, { params }: Props) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return jsonError("Please login to submit exams", 401);

    const user = await getAuthUser(userId);
    if (!user) return jsonError("Please login to submit exams", 401);

    const { id } = await params;
    const body = (await request.json()) as ExamSubmitInput;
    if (body.studentId && body.studentId !== userId) {
      return jsonError("Student mismatch", 403);
    }

    const result = await submitExam(
      id,
      {
        ...body,
        studentId: user.id,
        studentName: user.name,
        studentEmail: user.email,
      },
      baseUrl(request),
    );
    if ("error" in result) return jsonError(result.error, 400);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Submit failed", 500);
  }
}
