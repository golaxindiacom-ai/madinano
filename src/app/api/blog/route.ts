import { jsonOk } from "@/lib/admin/api-utils";
import { listPublicBlogs } from "@/lib/admin/public-content-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  return jsonOk(await listPublicBlogs(limit ? Number(limit) : undefined));
}
