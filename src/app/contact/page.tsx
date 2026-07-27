"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { Container } from "@/components/ui/container";

type PublicSettings = {
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  currency: string;
};

type FormStatus = { type: "success" | "error"; message: string } | null;

const emptyForm = { name: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setSettingsError(null);

        const response = await fetch("/api/settings/public", { cache: "no-store" });
        const json = await response.json();

        if (!response.ok || json?.success === false) {
          throw new Error(json?.error || "Unable to load contact details.");
        }

        if (active) {
          setSettings((json?.data ?? json) as PublicSettings);
        }
      } catch (err) {
        if (active) {
          setSettings(null);
          setSettingsError(err instanceof Error ? err.message : "Unable to load contact details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.message.trim().length > 0 &&
      !submitting
    );
  }, [form, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "Failed to send your message.");
      }

      setStatus({
        type: "success",
        message: json?.data?.message || json?.message || "Thank you. We will get back to you soon.",
      });
      setForm(emptyForm);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />

      <PageHero
        kicker="Contact Us"
        title={
          <>
            Let&apos;s Start A <span className="text-primary">Conversation</span>
          </>
        }
        subtitle={`Have a question about ${settings?.siteName ?? "our courses"}, partnerships or anything else? Our team is happy to help.`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <PageBand tone="why">
        <Container>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading contact info...</p>
          ) : settingsError ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
              <AlertCircle className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-ink">Could not load contact details.</p>
              <p className="mt-1 text-xs text-muted-foreground">{settingsError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <InfoCard
                icon={Mail}
                label="Email Us"
                value={settings?.siteEmail ?? "Not available"}
                sub="We reply within 24 hours"
              />
              <InfoCard
                icon={Phone}
                label="Call Us"
                value={settings?.sitePhone ?? "Not available"}
                sub="Mon-Sat, 9AM-7PM IST"
              />
              <InfoCard
                icon={MapPin}
                label="About Us"
                value={settings?.siteName ?? "Not available"}
                sub="Online learning platform"
              />
              <InfoCard
                icon={Clock}
                label="Working Hours"
                value="9:00 AM - 7:00 PM"
                sub="Sunday closed"
              />
            </div>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-xl border border-border bg-card p-8 shadow-card">
              <div className="text-xl font-bold text-ink">Send Us A Message</div>
              <p className="text-sm text-muted-foreground">
                Fill out the form and our team will get back to you shortly.
              </p>

              {status ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                    status.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {status.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{status.message}</span>
                </div>
              ) : null}

              <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
                <Field
                  label="Your Name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                  required
                />
                <Field
                  label="Email Address"
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                  required
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Subject"
                    placeholder="How can we help?"
                    value={form.subject}
                    onChange={(value) => setForm((current) => ({ ...current, subject: value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Message</label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Write your message..."
                    className="w-full rounded-xl border border-border bg-background/40 px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/30 via-primary/10 to-muted" />
                <div className="p-5">
                  <div className="text-sm font-bold text-ink">Our Headquarters</div>
                  <div className="text-xs text-muted-foreground">
                    {settings?.siteName ?? "This platform"} - Learn online, grow anywhere.
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="text-lg font-bold text-ink">Chat With Support</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Email us at{" "}
                  <a
                    href={settings?.siteEmail ? `mailto:${settings.siteEmail}` : "#"}
                    className="font-semibold text-primary"
                  >
                    {settings?.siteEmail ?? "Not available"}
                  </a>{" "}
                  for quick assistance.
                </p>
                <div className="mt-5 grid gap-3">
                  <a
                    href={settings?.siteEmail ? `mailto:${settings.siteEmail}` : "#"}
                    className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary"
                  >
                    Email: {settings?.siteEmail ?? "Not available"}
                  </a>
                  <a
                    href={settings?.sitePhone ? `tel:${settings.sitePhone}` : "#"}
                    className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary"
                  >
                    Call: {settings?.sitePhone ?? "Not available"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </PageBand>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-background/40 px-4 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-ink">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
