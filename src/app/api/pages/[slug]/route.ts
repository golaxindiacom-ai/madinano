import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { ensureCmsPagesHaveContent, getPublishedCmsPage } from "@/lib/cms/cms-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await ensureCmsPagesHaveContent();
    const { slug } = await context.params;
    const page = await getPublishedCmsPage(slug);
    if (!page) return jsonError("Page not found", 404);
    return jsonOk(page);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load page", 500);
  }
}
