import { jsonOk } from "@/lib/admin/api-utils";
import { getCategoryTreeData } from "@/lib/admin/category-service";

export async function GET() {
  return jsonOk(await getCategoryTreeData());
}
