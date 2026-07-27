import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { createCategory, getCategoryStats, getCategoryTreeData } from "@/lib/admin/category-service";
import type { CategoryInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getCategoryStats());
    }
    return jsonOk(await getCategoryTreeData());
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load categories", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CategoryInput;
    const category = await createCategory(body);
    return jsonOk(category, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create category", 400);
  }
}
