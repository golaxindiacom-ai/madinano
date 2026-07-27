import { readDb } from "@/lib/admin/db";
import { normalizeCategory, validateCategoryParent } from "@/lib/admin/categories";
import type { CategoryLevel } from "@/lib/admin/types";
import { API_RESOURCE_MAP } from "@/lib/admin/resources";
import {
  deleteItem,
  getItem,
  jsonError,
  jsonOk,
  updateItem,
} from "@/lib/admin/api-utils";

type Params = { params: Promise<{ resource: string; id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    const key = API_RESOURCE_MAP[resource];
    if (!key) return jsonError("Resource not found", 404);

    const item = await getItem(key, id);
    if (!item) return jsonError("Item not found", 404);
    return jsonOk(item);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to get item", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    const key = API_RESOURCE_MAP[resource];
    if (!key) return jsonError("Resource not found", 404);
    if (key === "systemLogs") return jsonError("System logs are read-only", 403);

    const body = await request.json();
    if (key === "roles" && typeof body.permissions === "string") {
      body.permissions = body.permissions.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    if (key === "categories") {
      const db = await readDb();
      const categories = db.categories.map((c) => normalizeCategory(c as Record<string, unknown>));
      const level = Number(body.level ?? 1) as CategoryLevel;
      const parentId = body.parentId ?? null;
      const err = validateCategoryParent(categories, parentId, level, id);
      if (err) return jsonError(err);
    }

    const item = await updateItem(key, id, body);
    if (!item) return jsonError("Item not found", 404);
    return jsonOk(item);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update item", 500);
  }
}

export async function PATCH(request: Request, ctx: Params) {
  return PUT(request, ctx);
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    const key = API_RESOURCE_MAP[resource];
    if (!key) return jsonError("Resource not found", 404);
    if (key === "systemLogs") return jsonError("System logs are read-only", 403);

    const deleted = await deleteItem(key, id);
    if (!deleted) return jsonError("Item not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete item", 500);
  }
}
