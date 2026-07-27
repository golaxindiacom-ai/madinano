import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getStudentDashboard } from "@/lib/admin/public-content-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) return jsonError("Please login to view dashboard", 401);
  return jsonOk(await getStudentDashboard(userId));
}
