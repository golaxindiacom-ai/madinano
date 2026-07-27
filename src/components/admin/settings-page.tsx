"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { fileToDataUrl } from "@/lib/certificate-settings";
import type {
  AppSettings,
  CertificateSigner,
  HomeCmsContent,
  PaymentGatewayCredentials,
} from "@/lib/admin/types";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

function SignerFields({
  label,
  signer,
  onChange,
}: {
  label: string;
  signer: CertificateSigner;
  onChange: (s: CertificateSigner) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange({ ...signer, signatureImage: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
      <p className="text-sm font-bold text-ink">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</span>
          <input
            value={signer.name}
            onChange={(e) => onChange({ ...signer, name: e.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</span>
          <input
            value={signer.title}
            onChange={(e) => onChange({ ...signer, title: e.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signature Image</span>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <div className="flex h-20 min-w-[140px] items-center justify-center rounded-lg border border-dashed border-border bg-card px-4">
            {signer.signatureImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signer.signatureImage} alt={`${label} signature`} className="max-h-16 max-w-[180px] object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No signature uploaded</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted/50">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload PNG/JPG"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
            {signer.signatureImage && (
              <button
                type="button"
                onClick={() => onChange({ ...signer, signatureImage: "" })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <p className="mt-1 text-[11px] text-muted-foreground">Transparent PNG works best. Max 600 KB.</p>
      </div>
    </div>
  );
}

function GatewayFields({
  label,
  gateway,
  onChange,
}: {
  label: string;
  gateway: PaymentGatewayCredentials;
  onChange: (next: PaymentGatewayCredentials) => void;
}) {
  const field = (
    key: keyof PaymentGatewayCredentials,
    fieldLabel: string,
    type: "text" | "password" = "text",
  ) => (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {fieldLabel}
      </span>
      <input
        type={type}
        value={String(gateway[key] ?? "")}
        onChange={(e) => onChange({ ...gateway, [key]: e.target.value })}
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        autoComplete="off"
      />
    </label>
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">{label}</p>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={gateway.enabled}
            onChange={(e) => onChange({ ...gateway, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mode</span>
        <select
          value={gateway.mode}
          onChange={(e) =>
            onChange({ ...gateway, mode: e.target.value === "live" ? "live" : "test" })
          }
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="test">Test</option>
          <option value="live">Live</option>
        </select>
      </label>

      {field("keyId", "Key ID")}
      {field("keySecret", "Key Secret", "password")}
      {field("webhookSecret", "Webhook Secret", "password")}
    </div>
  );
}

const HOME_CMS_FIELDS: { key: keyof HomeCmsContent; label: string; multiline?: boolean }[] = [
  { key: "heroKicker", label: "Hero Kicker" },
  { key: "heroTitleLine1", label: "Hero Title Line 1" },
  { key: "heroHighlight1", label: "Hero Highlight 1" },
  { key: "heroTitleLine2", label: "Hero Title Line 2" },
  { key: "heroHighlight2", label: "Hero Highlight 2" },
  { key: "heroSubtitle", label: "Hero Subtitle", multiline: true },
  { key: "primaryCtaLabel", label: "Primary CTA Label" },
  { key: "primaryCtaHref", label: "Primary CTA Href" },
  { key: "secondaryCtaLabel", label: "Secondary CTA Label" },
  { key: "secondaryCtaHref", label: "Secondary CTA Href" },
];

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch<AppSettings>("/api/admin/settings").then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await adminFetch<AppSettings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      setMessage("Settings saved successfully");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateCertificate = (patch: Partial<AppSettings["certificate"]>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      certificate: { ...settings.certificate, ...patch },
    });
  };

  const updateGateway = (
    provider: "razorpay" | "cashfree",
    next: PaymentGatewayCredentials,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      paymentGateways: {
        ...settings.paymentGateways,
        [provider]: next,
      },
    });
  };

  const updateHomeCms = (key: keyof HomeCmsContent, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      cms: {
        ...settings.cms,
        home: {
          ...settings.cms.home,
          [key]: value,
        },
      },
    });
  };

  if (!settings) return <div className="text-sm text-muted-foreground">Loading settings...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure site, payments, CMS, certificate, and your account security
        </p>
      </div>

      <ChangePasswordForm
        title="Admin Password"
        description="Change the password for your currently signed-in admin or instructor account."
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-ink">General</h2>
          {[
            ["siteName", "Site Name"],
            ["siteEmail", "Site Email"],
            ["sitePhone", "Site Phone"],
            ["currency", "Currency"],
            ["timezone", "Timezone"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
              <input
                value={settings[key as keyof AppSettings] as string}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          ))}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
            <span className="text-sm font-semibold">Maintenance Mode</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
            />
            <span className="text-sm font-semibold">Allow Registration</span>
          </label>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-bold text-ink">Payment Gateways</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              When both gateways are disabled, checkout uses demo pay. Enable a gateway and add keys
              to go live.
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primary Gateway
            </span>
            <select
              value={settings.paymentGateways.primary}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentGateways: {
                    ...settings.paymentGateways,
                    primary: e.target.value as AppSettings["paymentGateways"]["primary"],
                  },
                })
              }
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="auto">Auto</option>
              <option value="razorpay">Razorpay</option>
              <option value="cashfree">Cashfree</option>
            </select>
          </label>

          <GatewayFields
            label="Razorpay"
            gateway={settings.paymentGateways.razorpay}
            onChange={(next) => updateGateway("razorpay", next)}
          />
          <GatewayFields
            label="Cashfree"
            gateway={settings.paymentGateways.cashfree}
            onChange={(next) => updateGateway("cashfree", next)}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-bold text-ink">Website CMS / Home Hero</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Edit homepage hero copy, CTAs, footer tagline, and social URLs.
            </p>
          </div>

          {HOME_CMS_FIELDS.map(({ key, label, multiline }) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              {multiline ? (
                <textarea
                  value={settings.cms.home[key]}
                  onChange={(e) => updateHomeCms(key, e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              ) : (
                <input
                  value={settings.cms.home[key]}
                  onChange={(e) => updateHomeCms(key, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              )}
            </label>
          ))}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Footer Tagline
            </span>
            <textarea
              value={settings.cms.footerTagline}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cms: { ...settings.cms, footerTagline: e.target.value },
                })
              }
              rows={2}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {(
            [
              ["socialFacebook", "Facebook URL"],
              ["socialTwitter", "Twitter URL"],
              ["socialInstagram", "Instagram URL"],
              ["socialLinkedin", "LinkedIn URL"],
              ["socialYoutube", "YouTube URL"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <input
                value={settings.cms[key]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cms: { ...settings.cms, [key]: e.target.value },
                  })
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-bold text-ink">Certificate Settings</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Organization details and director/registrar signatures appear on all issued certificates.
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization Name</span>
            <input
              value={settings.certificate.organizationName}
              onChange={(e) => updateCertificate({ organizationName: e.target.value })}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization Subtitle</span>
            <input
              value={settings.certificate.organizationSubtitle}
              onChange={(e) => updateCertificate({ organizationSubtitle: e.target.value })}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <SignerFields
            label="Director"
            signer={settings.certificate.director}
            onChange={(director) => updateCertificate({ director })}
          />

          <SignerFields
            label="Registrar"
            signer={settings.certificate.registrar}
            onChange={(registrar) => updateCertificate({ registrar })}
          />
        </div>

        {message && <p className="text-sm text-primary">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
