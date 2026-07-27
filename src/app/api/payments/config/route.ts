import { jsonOk } from "@/lib/admin/api-utils";
import { getPublicPaymentConfig } from "@/lib/payments/gateway";

export async function GET() {
  const config = await getPublicPaymentConfig();
  return jsonOk(config);
}
