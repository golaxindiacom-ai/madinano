import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { submitContact } from "@/lib/admin/public-content-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitContact(body);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to submit", 400);
  }
}
