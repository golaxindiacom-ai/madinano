import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteCourseFull,
  getCourseAdminDetail,
  updateCourseStatus,
} from "@/lib/admin/course-service";
import type { Course } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getCourseAdminDetail(id);
    if (!detail) return jsonError("Course not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load course", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { status: Course["status"] };
    if (!body.status) return jsonError("Status is required");
    const course = await updateCourseStatus(id, body.status);
    if (!course) return jsonError("Course not found", 404);
    return jsonOk(course);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update status", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteCourseFull(id);
    if (!ok) return jsonError("Course not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete course", 400);
  }
}
