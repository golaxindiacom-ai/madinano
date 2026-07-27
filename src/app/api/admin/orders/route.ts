import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  createOrder,
  getOrderStats,
  listCoursesForOrders,
  listOrders,
  listStudentsForOrders,
} from "@/lib/admin/payment-service";
import type { Order, OrderInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getOrderStats());
    }
    if (searchParams.get("courses") === "true") {
      return jsonOk(await listCoursesForOrders());
    }
    if (searchParams.get("students") === "true") {
      return jsonOk(await listStudentsForOrders());
    }

    const orders = await listOrders({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as Order["status"] | "all") ?? "all",
      courseId: searchParams.get("courseId") ?? undefined,
      awaitingPayment: searchParams.get("awaitingPayment") === "true",
      awaitingEnrollment: searchParams.get("awaitingEnrollment") === "true",
    });
    return jsonOk(orders);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list orders", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderInput;
    const order = await createOrder(body);
    return jsonOk(order, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create order", 400);
  }
}
