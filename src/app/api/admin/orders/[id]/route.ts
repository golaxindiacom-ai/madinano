import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteOrder,
  enrollOrderStudent,
  fulfillOrder,
  getOrderDetail,
  updateOrderStatus,
} from "@/lib/admin/payment-service";
import type { FulfillOrderInput, Order } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getOrderDetail(id);
    if (!detail) return jsonError("Order not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load order", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "fulfill") {
      const detail = await fulfillOrder(id, {
        method: body.method,
        enroll: body.enroll,
      } as FulfillOrderInput);
      return jsonOk(detail);
    }

    if (body.action === "enroll") {
      const detail = await enrollOrderStudent(id);
      return jsonOk(detail);
    }

    if (body.status) {
      const order = await updateOrderStatus(id, body.status as Order["status"]);
      if (!order) return jsonError("Order not found", 404);
      return jsonOk(order);
    }

    return jsonError("Invalid update", 400);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update order", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteOrder(id);
    if (!ok) return jsonError("Order not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete order", 400);
  }
}
