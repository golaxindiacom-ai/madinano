import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { fetchCashfreeOrderStatus, verifyRazorpaySignature } from "@/lib/payments/gateway";
import { fulfillGatewayPayment } from "@/lib/admin/payment-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return jsonError("Login required", 401);

    const body = await request.json();
    const provider = String(body.provider || "");
    const paymentId = String(body.paymentId || "");
    if (!paymentId) return jsonError("paymentId is required", 400);

    if (provider === "razorpay") {
      const orderId = String(body.razorpay_order_id || "");
      const rzPaymentId = String(body.razorpay_payment_id || "");
      const signature = String(body.razorpay_signature || "");
      const ok = await verifyRazorpaySignature({
        orderId,
        paymentId: rzPaymentId,
        signature,
      });
      if (!ok) return jsonError("Invalid Razorpay signature", 400);
      const result = await fulfillGatewayPayment({
        paymentId,
        userId,
        transactionId: rzPaymentId,
        gatewayOrderId: orderId,
      });
      return jsonOk(result);
    }

    if (provider === "cashfree") {
      const orderId = String(body.orderId || body.cashfree_order_id || "");
      const status = await fetchCashfreeOrderStatus(orderId);
      if (String(status.order_status || "").toUpperCase() !== "PAID") {
        return jsonError(`Payment not completed (${status.order_status || "unknown"})`, 400);
      }
      const result = await fulfillGatewayPayment({
        paymentId,
        userId,
        transactionId: String(status.cf_order_id || orderId),
        gatewayOrderId: orderId,
      });
      return jsonOk(result);
    }

    return jsonError("Unsupported payment provider", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Verification failed", 400);
  }
}
