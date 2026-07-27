import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { listStudentPayments } from "@/lib/admin/payment-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) return jsonError("Please login to view payments", 401);
  const items = await listStudentPayments(userId);
  return jsonOk(items);
}
