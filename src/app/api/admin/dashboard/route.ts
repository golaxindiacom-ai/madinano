import { getDashboardStats, jsonOk, jsonError } from "@/lib/admin/api-utils";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return jsonOk(stats);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load dashboard", 500);
  }
}
