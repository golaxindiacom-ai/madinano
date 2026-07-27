import { jsonOk } from "@/lib/admin/api-utils";
import { getHomePageData } from "@/lib/admin/public-content-service";

export async function GET() {
  return jsonOk(await getHomePageData());
}
