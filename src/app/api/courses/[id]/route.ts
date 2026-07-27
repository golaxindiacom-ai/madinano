import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getPublicCourse } from "@/lib/admin/public-content-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const course = await getPublicCourse(id);
  if (!course) return jsonError("Course not found", 404);
  return jsonOk(course);
}
