import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { changePassword } from "@/lib/auth/auth-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return jsonError("Please login to change your password", 401);

    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (confirmPassword && confirmPassword !== newPassword) {
      return jsonError("New password and confirmation do not match", 400);
    }

    const result = await changePassword(userId, currentPassword, newPassword);
    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to change password",
      400,
    );
  }
}
