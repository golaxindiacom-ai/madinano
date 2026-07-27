import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteSubscription,
  getSubscriptionDetail,
  renewSubscription,
  updateSubscription,
  updateSubscriptionStatus,
} from "@/lib/admin/subscription-service";
import type { Subscription, SubscriptionInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getSubscriptionDetail(id);
    if (!detail) return jsonError("Subscription not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load subscription", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as SubscriptionInput;
    const item = await updateSubscription(id, body);
    if (!item) return jsonError("Subscription not found", 404);
    return jsonOk(item);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update subscription", 400);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "renew") {
      const item = await renewSubscription(id);
      if (!item) return jsonError("Subscription not found", 404);
      return jsonOk(item);
    }

    if (body.status) {
      const item = await updateSubscriptionStatus(id, body.status as Subscription["status"]);
      if (!item) return jsonError("Subscription not found", 404);
      return jsonOk(item);
    }

    return PUT(request, { params });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update subscription", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteSubscription(id);
    if (!ok) return jsonError("Subscription not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete subscription", 400);
  }
}
