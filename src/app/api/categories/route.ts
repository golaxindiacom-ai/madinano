import { jsonOk } from "@/lib/admin/api-utils";
import { listPublicCategories } from "@/lib/admin/public-content-service";

export async function GET() {
  return jsonOk(await listPublicCategories());
}
