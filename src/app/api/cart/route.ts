import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getCartItems, listActiveCoupons } from "@/lib/admin/payment-service";
import { readDb } from "@/lib/admin/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    const db = await readDb();
    const availableCoupons = listActiveCoupons(db);

    if (!ids.length) {
      return jsonOk({ items: [], availableCoupons });
    }

    const items = await getCartItems(ids);
    return jsonOk({ items, availableCoupons });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load cart", 500);
  }
}
