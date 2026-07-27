import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { listStudentOrders } from "@/lib/admin/payment-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) return jsonError("Please login to view orders", 401);
  const items = await listStudentOrders(userId);
  return jsonOk(items);
}
