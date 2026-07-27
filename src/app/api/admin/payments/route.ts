import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  createManualPayment,
  getOrderStats,
  getPaymentMethodOptions,
  getPaymentStats,
  listCoursesForOrders,
  listOrders,
  listPayments,
} from "@/lib/admin/payment-service";
import type { Order, Payment, PaymentInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getPaymentStats());
    }
    if (searchParams.get("orderStats") === "true") {
      return jsonOk(await getOrderStats());
    }
    if (searchParams.get("methods") === "true") {
      return jsonOk(getPaymentMethodOptions());
    }
    if (searchParams.get("courses") === "true") {
      return jsonOk(await listCoursesForOrders());
    }
    if (searchParams.get("orders") === "true") {
      const orders = await listOrders({
        search: searchParams.get("search") ?? undefined,
        status: (searchParams.get("status") as Order["status"] | "all") ?? "all",
        courseId: searchParams.get("courseId") ?? undefined,
      });
      return jsonOk(orders);
    }

    const payments = await listPayments({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as Payment["status"] | "all") ?? "all",
      method: (searchParams.get("method") as Payment["method"] | "all") ?? "all",
    });
    return jsonOk(payments);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list payments", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PaymentInput;
    const payment = await createManualPayment(body);
    return jsonOk(payment, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create payment", 400);
  }
}
