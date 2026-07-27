import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { listPublishedGallery } from "@/lib/cms/cms-service";

export async function GET() {
  try {
    const items = await listPublishedGallery();
    return jsonOk(items);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load gallery", 500);
  }
}
