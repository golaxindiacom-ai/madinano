import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  cancelStudentSubscription,
  getActiveSubscription,
  listStudentSubscriptions,
  subscribeStudent,
} from "@/lib/admin/subscription-service";
import type { SubscribeInput } from "@/lib/admin/types";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) return jsonError("Please login to view subscriptions", 401);

  const { searchParams } = new URL(request.url);
  if (searchParams.get("active") === "true") {
    const active = await getActiveSubscription(userId);
    return jsonOk(active);
  }

  const items = await listStudentSubscriptions(userId);
  return jsonOk(items);
}

export async function POST(request: Request) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return jsonError("Please login to manage subscriptions", 401);

    const body = await request.json();

    if (body.action === "cancel") {
      const item = await cancelStudentSubscription(userId, String(body.subscriptionId));
      return jsonOk(item);
    }

    const input: SubscribeInput = {
      userId,
      plan: body.plan,
      method: body.method ?? "upi",
      autoRenew: Boolean(body.autoRenew),
    };

    const result = await subscribeStudent(input);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Subscription failed", 400);
  }
}
