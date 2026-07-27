import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getInstructorDashboard } from "@/lib/admin/public-content-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slugOrId = searchParams.get("instructorId") || searchParams.get("slug") || "john-smith";
    const data = await getInstructorDashboard(slugOrId);
    if (!data) return jsonError("Instructor not found", 404);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load instructor dashboard", 500);
  }
}
