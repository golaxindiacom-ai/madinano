import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { deleteUser, updateUser } from "@/lib/admin/user-service";
import { getUserDetail } from "@/lib/admin/user-service";
import type { UserInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getUserDetail(id);
    if (!detail) return jsonError("User not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load user", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UserInput;
    const user = await updateUser(id, body);
    if (!user) return jsonError("User not found", 404);
    return jsonOk(user);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update user", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteUser(id);
    if (!ok) return jsonError("User not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete user", 400);
  }
}
