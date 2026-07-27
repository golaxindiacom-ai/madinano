import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { createCourseFull } from "@/lib/admin/course-builder";
import type { CourseBuilderInput } from "@/lib/admin/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CourseBuilderInput;
    if (!body.title?.trim()) return jsonError("Course title is required");
    if (!body.mainCategoryId && !body.categoryId) return jsonError("Main category is required");
    if (!body.instructorId) return jsonError("Instructor is required");
    if (!body.description?.trim()) return jsonError("Course description is required");

    const result = await createCourseFull(body);
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create course", 500);
  }
}
