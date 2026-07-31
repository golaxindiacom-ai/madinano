import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/admin/db";
import { pushActivity, queueEmail } from "@/lib/notifications/notification-service";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function subscribeNewsletter(email: string) {
  if (!email?.trim()) throw new Error("Email is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error("Enter a valid email address");
  }

  const db = await readDb();
  if (!db.newsletterSubscribers) db.newsletterSubscribers = [];
  const normalized = normalizeEmail(email);
  const existing = db.newsletterSubscribers.find(
    (subscriber) => normalizeEmail(subscriber.email) === normalized,
  );
  const ts = new Date().toISOString();

  if (existing) {
    if (existing.status === "active") {
      return { subscribed: true, message: "You are already subscribed." };
    }
    existing.status = "active";
    existing.updatedAt = ts;
  } else {
    db.newsletterSubscribers.unshift({
      id: randomUUID(),
      email: email.trim(),
      status: "active",
      createdAt: ts,
      updatedAt: ts,
    });
  }

  pushActivity(db, {
    message: `Newsletter subscribe: ${email.trim()}`,
    type: "newsletter",
    audience: "admin",
    href: "/admin",
  });
  await writeDb(db);

  await queueEmail({
    to: email.trim(),
    subject: "You're subscribed to Madinano updates",
    body: `Thanks for subscribing!\n\nYou'll receive course updates, research notes, and offers from Madinano.\n\nIf this wasn't you, ignore this message.`,
    relatedType: "newsletter",
  });

  const settings = db.settings;
  if (settings?.siteEmail) {
    await queueEmail({
      to: settings.siteEmail,
      subject: `New newsletter subscriber: ${email.trim()}`,
      body: `${email.trim()} joined the newsletter list.`,
      relatedType: "newsletter-admin",
    });
  }

  return { subscribed: true, message: "Subscribed successfully. Check your inbox for a confirmation." };
}
