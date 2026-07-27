import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  listEmailOutbox,
  listNotificationsForUser,
  markNotificationsRead,
} from "@/lib/notifications/notification-service";
import { getAuthUser } from "@/lib/auth/auth-service";

export async function GET(request: Request) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return jsonError("Login required", 401);

    const { searchParams } = new URL(request.url);
    if (searchParams.get("emails") === "true") {
      const user = await getAuthUser(userId);
      if (!user || (user.role !== "admin" && user.role !== "instructor")) {
        return jsonError("Admin access required", 403);
      }
      const emails = await listEmailOutbox(40);
      return jsonOk({ emails });
    }

    const data = await listNotificationsForUser(userId, 30);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load notifications", 400);
  }
}

export async function POST(request: Request) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return jsonError("Login required", 401);

    const body = await request.json();
    const result = await markNotificationsRead(
      userId,
      Array.isArray(body.ids) ? body.ids.map(String) : undefined,
      Boolean(body.all),
    );
    const data = await listNotificationsForUser(userId, 30);
    return jsonOk({ ...data, ...result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update notifications", 400);
  }
}
