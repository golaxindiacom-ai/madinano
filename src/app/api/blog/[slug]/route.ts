import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getPublicBlogBySlug } from "@/lib/admin/public-content-service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const blog = await getPublicBlogBySlug(slug);
    if (!blog) return jsonError("Blog post not found", 404);
    return jsonOk(blog);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load blog", 500);
  }
}
