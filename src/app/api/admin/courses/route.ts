import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getCourseStats, listCourses } from "@/lib/admin/course-service";
import type { Course } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getCourseStats());
    }
    const courses = await listCourses({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as Course["status"] | "all") ?? "all",
      mode: (searchParams.get("mode") as Course["mode"] | "all") ?? "all",
      instructorId: searchParams.get("instructorId") ?? undefined,
    });
    return jsonOk(courses);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list courses", 500);
  }
}
