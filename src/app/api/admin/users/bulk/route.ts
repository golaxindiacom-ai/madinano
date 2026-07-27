import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { bulkUpdateUserStatus } from "@/lib/admin/user-service";
import type { User } from "@/lib/admin/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids: string[]; status: User["status"] };
    if (!body.ids?.length) return jsonError("No users selected");
    if (!body.status) return jsonError("Status is required");
    const count = await bulkUpdateUserStatus(body.ids, body.status);
    return jsonOk({ updated: count });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Bulk update failed", 400);
  }
}
