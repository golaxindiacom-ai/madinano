import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { subscribeNewsletter } from "@/lib/newsletter/newsletter-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await subscribeNewsletter(String(body.email ?? ""));
    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Subscribe failed", 400);
  }
}
