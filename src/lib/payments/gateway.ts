import { createHmac } from "crypto";
import { getSettings } from "@/lib/admin/db";
import type { PaymentGatewaysSettings } from "@/lib/admin/types";

export type ActiveGateway = "razorpay" | "cashfree" | "demo";

export function resolveActiveGateway(gateways: PaymentGatewaysSettings): ActiveGateway {
  const razorpayReady =
    gateways.razorpay.enabled &&
    Boolean(gateways.razorpay.keyId.trim()) &&
    Boolean(gateways.razorpay.keySecret.trim());
  const cashfreeReady =
    gateways.cashfree.enabled &&
    Boolean(gateways.cashfree.keyId.trim()) &&
    Boolean(gateways.cashfree.keySecret.trim());

  if (gateways.primary === "razorpay" && razorpayReady) return "razorpay";
  if (gateways.primary === "cashfree" && cashfreeReady) return "cashfree";
  if (razorpayReady) return "razorpay";
  if (cashfreeReady) return "cashfree";
  return "demo";
}

export async function getPublicPaymentConfig() {
  const settings = await getSettings();
  const active = resolveActiveGateway(settings.paymentGateways);
  return {
    provider: active,
    currency: settings.currency || "INR",
    razorpay: {
      enabled: settings.paymentGateways.razorpay.enabled && Boolean(settings.paymentGateways.razorpay.keyId),
      mode: settings.paymentGateways.razorpay.mode,
      keyId: settings.paymentGateways.razorpay.enabled
        ? settings.paymentGateways.razorpay.keyId
        : "",
    },
    cashfree: {
      enabled: settings.paymentGateways.cashfree.enabled && Boolean(settings.paymentGateways.cashfree.keyId),
      mode: settings.paymentGateways.cashfree.mode,
      keyId: settings.paymentGateways.cashfree.enabled
        ? settings.paymentGateways.cashfree.keyId
        : "",
    },
  };
}

export async function createRazorpayOrder(input: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const settings = await getSettings();
  const gw = settings.paymentGateways.razorpay;
  if (!gw.enabled || !gw.keyId || !gw.keySecret) {
    throw new Error("Razorpay is not configured");
  }

  const amountPaise = Math.round(input.amountInr * 100);
  const auth = Buffer.from(`${gw.keyId}:${gw.keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: settings.currency || "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes ?? {},
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.description || "Failed to create Razorpay order");
  }

  return {
    orderId: String(json.id),
    amount: amountPaise,
    currency: String(json.currency || "INR"),
    keyId: gw.keyId,
  };
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  return getSettings().then((settings) => {
    const secret = settings.paymentGateways.razorpay.keySecret;
    const payload = `${input.orderId}|${input.paymentId}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    return expected === input.signature;
  });
}

export async function createCashfreeOrder(input: {
  amountInr: number;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  returnUrl: string;
}) {
  const settings = await getSettings();
  const gw = settings.paymentGateways.cashfree;
  if (!gw.enabled || !gw.keyId || !gw.keySecret) {
    throw new Error("Cashfree is not configured");
  }

  const base =
    gw.mode === "live" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

  const response = await fetch(`${base}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": gw.keyId,
      "x-client-secret": gw.keySecret,
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amountInr.toFixed(2)),
      order_currency: settings.currency || "INR",
      customer_details: {
        customer_id: input.customerId.slice(0, 50),
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone.replace(/\D/g, "").slice(-10) || "9999999999",
        customer_name: input.customerName,
      },
      order_meta: {
        return_url: input.returnUrl,
      },
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || json?.error || "Failed to create Cashfree order");
  }

  return {
    orderId: String(json.order_id || input.orderId),
    paymentSessionId: String(json.payment_session_id || ""),
    keyId: gw.keyId,
    mode: gw.mode,
  };
}

export async function fetchCashfreeOrderStatus(orderId: string) {
  const settings = await getSettings();
  const gw = settings.paymentGateways.cashfree;
  if (!gw.keyId || !gw.keySecret) throw new Error("Cashfree is not configured");

  const base =
    gw.mode === "live" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

  const response = await fetch(`${base}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "x-api-version": "2023-08-01",
      "x-client-id": gw.keyId,
      "x-client-secret": gw.keySecret,
    },
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || "Unable to verify Cashfree payment");
  }
  return json as { order_status?: string; cf_order_id?: string };
}
