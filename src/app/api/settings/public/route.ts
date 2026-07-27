import { jsonOk } from "@/lib/admin/api-utils";
import { getPublicSettings } from "@/lib/admin/public-content-service";

export async function GET() {
  return jsonOk(await getPublicSettings());
}
