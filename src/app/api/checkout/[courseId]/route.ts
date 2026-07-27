import { getCheckoutPageData, processCheckout, validateCoupon } from "@/lib/admin/payment-service";
import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import type { CheckoutInput } from "@/lib/admin/types";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { courseId } = await params;
    const data = await getCheckoutPageData(courseId);
    if (!data) return jsonError("Course not found or not available", 404);
    return jsonOk(data);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load course", 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const sessionUserId = getSessionUserIdFromRequest(request);
    if (!sessionUserId) return jsonError("Please login to continue checkout", 401);

    const { courseId } = await params;
    const body = await request.json();

    if (body.action === "validate-coupon") {
      if (!body.code) return jsonError("Coupon code required", 400);
      const result = await validateCoupon(String(body.code), courseId);
      return jsonOk(result);
    }

    if (body.userId && body.userId !== sessionUserId) {
      return jsonError("Session mismatch. Please login again.", 403);
    }

    const checkout: CheckoutInput = {
      courseId,
      userId: sessionUserId,
      method: body.method,
      couponCode: body.couponCode,
      billingAddress: body.billingAddress,
    };

    const result = await processCheckout(checkout);
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Checkout failed", 400);
  }
}
