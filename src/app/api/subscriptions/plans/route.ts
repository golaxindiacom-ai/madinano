import { jsonOk } from "@/lib/admin/api-utils";
import { listPublicPlans } from "@/lib/admin/subscription-service";

export async function GET() {
  return jsonOk(listPublicPlans());
}
