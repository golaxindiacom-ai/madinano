import { exportDb, importDb } from "@/lib/admin/db";
import { jsonOk, jsonError } from "@/lib/admin/api-utils";

export async function GET() {
  try {
    const data = await exportDb();
    return jsonOk(data);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Export failed", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return jsonError("Invalid backup data");
    }
    const restored = await importDb(body);
    return jsonOk(restored, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Restore failed", 500);
  }
}
