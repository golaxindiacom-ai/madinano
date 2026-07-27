import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { deleteCategory, getCategoryDetail, updateCategory } from "@/lib/admin/category-service";
import type { CategoryInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getCategoryDetail(id);
    if (!detail) return jsonError("Category not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load category", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as CategoryInput;
    const category = await updateCategory(id, body);
    if (!category) return jsonError("Category not found", 404);
    return jsonOk(category);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update category", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteCategory(id);
    if (!ok) return jsonError("Category not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete category", 400);
  }
}
