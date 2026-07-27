import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  createSubscription,
  getSubscriptionStats,
  listPublicPlans,
  listStudentsForSubscriptions,
  listSubscriptions,
} from "@/lib/admin/subscription-service";
import type { Subscription, SubscriptionInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getSubscriptionStats());
    }
    if (searchParams.get("students") === "true") {
      return jsonOk(await listStudentsForSubscriptions());
    }
    if (searchParams.get("plans") === "true") {
      return jsonOk(listPublicPlans());
    }

    const items = await listSubscriptions({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as Subscription["status"] | "all") ?? "all",
      plan: (searchParams.get("plan") as Subscription["plan"] | "all") ?? "all",
      expiringSoon: searchParams.get("expiringSoon") === "true",
    });
    return jsonOk(items);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list subscriptions", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscriptionInput;
    const item = await createSubscription(body);
    return jsonOk(item, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create subscription", 400);
  }
}
