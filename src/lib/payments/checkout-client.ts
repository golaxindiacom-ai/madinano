import type { CheckoutResult } from "@/lib/admin/types";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
};

type CashfreeInstance = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget?: string;
  }) => Promise<{ error?: { message?: string }; redirect?: boolean }>;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

async function verifyPayment(body: Record<string, unknown>) {
  const response = await fetch("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Payment verification failed");
  }
  return json.data;
}

async function openRazorpayCheckout(
  gateway: NonNullable<CheckoutResult["gateway"]>,
): Promise<boolean> {
  await loadScript("https://checkout.razorpay.com/v1/checkout.js");
  if (!window.Razorpay) throw new Error("Razorpay SDK failed to load");
  if (!gateway.keyId || !gateway.orderId) {
    throw new Error("Razorpay checkout is missing order details");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: gateway.keyId,
      amount: Math.round(gateway.amount * 100),
      currency: gateway.currency || "INR",
      name: "Navbharat Gurukulam",
      description: `Order ${gateway.orderNo}`,
      order_id: gateway.orderId,
      prefill: {
        name: gateway.studentName,
        email: gateway.studentEmail,
      },
      theme: { color: "#7c1d1d" },
      handler: async (response: RazorpayHandlerResponse) => {
        try {
          await verifyPayment({
            provider: "razorpay",
            paymentId: gateway.paymentId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve(true);
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Razorpay verification failed"));
        }
      },
      modal: {
        ondismiss: () => resolve(false),
      },
    });

    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Razorpay payment failed"));
    });

    rzp.open();
  });
}

async function openCashfreeCheckout(
  gateway: NonNullable<CheckoutResult["gateway"]>,
): Promise<boolean> {
  if (!gateway.paymentSessionId) {
    throw new Error("Cashfree checkout is missing payment session");
  }

  const configRes = await fetch("/api/payments/config", { cache: "no-store" });
  const configJson = await configRes.json();
  if (!configRes.ok || !configJson.success) {
    throw new Error(configJson.error || "Failed to load payment config");
  }
  const mode = configJson.data?.cashfree?.mode === "live" ? "production" : "sandbox";

  await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
  if (!window.Cashfree) throw new Error("Cashfree SDK failed to load");

  const cashfree = window.Cashfree({ mode });

  const result = await cashfree.checkout({
    paymentSessionId: gateway.paymentSessionId,
    redirectTarget: "_modal",
  });

  if (result?.error) {
    throw new Error(result.error.message || "Cashfree payment failed");
  }

  await verifyPayment({
    provider: "cashfree",
    paymentId: gateway.paymentId,
    orderId: gateway.orderId,
    cashfree_order_id: gateway.orderId,
  });

  return true;
}

export async function openGatewayCheckout(
  gateway: CheckoutResult["gateway"],
): Promise<boolean> {
  if (!gateway || gateway.provider === "demo") return true;

  if (gateway.provider === "razorpay") {
    return openRazorpayCheckout(gateway);
  }

  if (gateway.provider === "cashfree") {
    return openCashfreeCheckout(gateway);
  }

  return true;
}
