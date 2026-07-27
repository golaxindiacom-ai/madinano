import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getCourseFull, updateCourseFull } from "@/lib/admin/course-builder";
import type { CourseBuilderInput } from "@/lib/admin/types";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const data = await getCourseFull(id);
  if (!data) return jsonError("Course not found", 404);
  return jsonOk(data);
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = (await request.json()) as CourseBuilderInput;
    if (!body.title?.trim()) return jsonError("Course title is required");

    const result = await updateCourseFull(id, body);
    if (!result) return jsonError("Course not found", 404);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update course", 500);
  }
}
