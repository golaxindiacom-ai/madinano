import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deletePayment,
  getPaymentDetail,
  updatePaymentStatus,
} from "@/lib/admin/payment-service";
import type { Payment } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getPaymentDetail(id);
    if (!detail) return jsonError("Payment not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load payment", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.status) return jsonError("Status is required", 400);
    const payment = await updatePaymentStatus(id, body.status as Payment["status"]);
    if (!payment) return jsonError("Payment not found", 404);
    return jsonOk(payment);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update payment", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deletePayment(id);
    if (!ok) return jsonError("Payment not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete payment", 400);
  }
}
