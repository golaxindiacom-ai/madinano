import type { EmailOutboxItem } from "@/lib/admin/types";

/**
 * Delivers email alerts. Without RESEND_API_KEY this logs to the server console
 * and still records the message in the email outbox (admin can review alerts).
 * With RESEND_API_KEY + RESEND_FROM set, it attempts a real Resend API send.
 */
export async function deliverEmail(item: EmailOutboxItem) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Madinano <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `[email-alert] to=${item.to} subject="${item.subject}"\n${item.body}\n---`,
    );
    return { provider: "console" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [item.to],
      subject: item.subject,
      text: item.body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed (${response.status}): ${text}`);
  }

  return { provider: "resend" as const };
}
