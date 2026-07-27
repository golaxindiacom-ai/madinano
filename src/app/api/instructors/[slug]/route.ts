import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getPublicInstructorBySlug } from "@/lib/admin/public-content-service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const instructor = await getPublicInstructorBySlug(slug);
  if (!instructor) return jsonError("Instructor not found", 404);
  return jsonOk(instructor);
}
