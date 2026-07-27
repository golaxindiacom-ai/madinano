import { getSettings, updateSettings } from "@/lib/admin/db";
import { jsonOk, jsonError } from "@/lib/admin/api-utils";
import {
  isMaskedSecret,
  mergeAppSettings,
  redactPaymentSecrets,
} from "@/lib/certificate-settings";
import type { AppSettings, PaymentGatewayCredentials } from "@/lib/admin/types";

function mergeGatewayUpdate(
  current: PaymentGatewayCredentials,
  incoming?: Partial<PaymentGatewayCredentials>,
): PaymentGatewayCredentials {
  if (!incoming) return current;
  return {
    enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : current.enabled,
    mode: incoming.mode === "live" || incoming.mode === "test" ? incoming.mode : current.mode,
    keyId: incoming.keyId !== undefined ? String(incoming.keyId) : current.keyId,
    keySecret:
      incoming.keySecret !== undefined && !isMaskedSecret(String(incoming.keySecret))
        ? String(incoming.keySecret)
        : current.keySecret,
    webhookSecret:
      incoming.webhookSecret !== undefined && !isMaskedSecret(String(incoming.webhookSecret))
        ? String(incoming.webhookSecret)
        : current.webhookSecret,
  };
}

export async function GET() {
  try {
    const settings = await getSettings();
    return jsonOk(redactPaymentSecrets(settings));
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load settings", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<AppSettings>;
    const current = await getSettings();
    const next = mergeAppSettings({
      ...current,
      ...body,
      certificate: body.certificate ?? current.certificate,
      cms: body.cms ?? current.cms,
      paymentGateways: {
        primary:
          body.paymentGateways?.primary === "razorpay" ||
          body.paymentGateways?.primary === "cashfree" ||
          body.paymentGateways?.primary === "auto"
            ? body.paymentGateways.primary
            : current.paymentGateways.primary,
        razorpay: mergeGatewayUpdate(
          current.paymentGateways.razorpay,
          body.paymentGateways?.razorpay,
        ),
        cashfree: mergeGatewayUpdate(
          current.paymentGateways.cashfree,
          body.paymentGateways?.cashfree,
        ),
      },
    });
    const updated = await updateSettings(next);
    return jsonOk(redactPaymentSecrets(updated));
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update settings", 500);
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}
