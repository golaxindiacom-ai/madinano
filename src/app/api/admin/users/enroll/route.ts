import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { enrollUser, removeEnrollment } from "@/lib/admin/user-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId: string; courseId: string };
    if (!body.userId || !body.courseId) return jsonError("userId and courseId are required");
    const enrollment = await enrollUser(body.userId, body.courseId);
    return jsonOk(enrollment, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Enrollment failed", 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get("enrollmentId");
    if (!enrollmentId) return jsonError("enrollmentId is required");
    const ok = await removeEnrollment(enrollmentId);
    if (!ok) return jsonError("Enrollment not found", 404);
    return jsonOk({ removed: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Remove enrollment failed", 400);
  }
}
