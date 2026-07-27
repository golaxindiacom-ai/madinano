import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getAuthUser } from "@/lib/auth/auth-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) return jsonError("Not authenticated", 401);

  const user = await getAuthUser(userId);
  if (!user) return jsonError("Not authenticated", 401);
  return jsonOk(user);
}
