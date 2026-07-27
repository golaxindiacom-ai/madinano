import { readDb } from "@/lib/admin/db";
import { normalizeCategory, validateCategoryParent } from "@/lib/admin/categories";
import type { CategoryLevel } from "@/lib/admin/types";
import { API_RESOURCE_MAP } from "@/lib/admin/resources";
import {
  createItem,
  jsonError,
  jsonOk,
  listItems,
} from "@/lib/admin/api-utils";

type Params = { params: Promise<{ resource: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { resource } = await params;
    const key = API_RESOURCE_MAP[resource];
    if (!key) return jsonError("Resource not found", 404);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const items = await listItems(key, search);
    return jsonOk(items);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list items", 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { resource } = await params;
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
      const err = validateCategoryParent(categories, parentId, level);
      if (err) return jsonError(err);
      if (!body.parentId) body.parentId = null;
    }

    const item = await createItem(key, body);
    return jsonOk(item, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create item", 500);
  }
}
