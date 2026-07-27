import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { processCartCheckout, validateCartCoupon } from "@/lib/admin/payment-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import type { CartCheckoutInput } from "@/lib/admin/types";

export async function POST(request: Request) {
  try {
    const sessionUserId = getSessionUserIdFromRequest(request);
    if (!sessionUserId) return jsonError("Please login to continue checkout", 401);

    const body = await request.json();

    if (body.action === "validate-coupon") {
      if (!body.code) return jsonError("Coupon code required", 400);
      const courseIds: string[] = Array.isArray(body.courseIds) ? body.courseIds : [];
      const result = await validateCartCoupon(String(body.code), courseIds);
      return jsonOk(result);
    }

    if (body.userId && body.userId !== sessionUserId) {
      return jsonError("Session mismatch. Please login again.", 403);
    }

    const checkout: CartCheckoutInput = {
      courseIds: Array.isArray(body.courseIds) ? body.courseIds : [],
      userId: sessionUserId,
      method: body.method,
      couponCode: body.couponCode,
      billingAddress: body.billingAddress,
    };

    const result = await processCartCheckout(checkout);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Cart checkout failed", 400);
  }
}
