import { jsonOk } from "@/lib/admin/api-utils";
import { listPublicCourses } from "@/lib/admin/public-content-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const courses = await listPublicCourses({
    search: searchParams.get("search") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    level: searchParams.get("level") ?? undefined,
    sort: (searchParams.get("sort") as "popular" | "rating" | "newest" | "price-low" | "price-high") ?? "popular",
    limit: limit ? Number(limit) : undefined,
  });
  return jsonOk(courses);
}
