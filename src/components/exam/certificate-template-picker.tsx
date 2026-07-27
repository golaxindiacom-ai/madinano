"use client";

import { Check } from "lucide-react";
import type { CertificateTemplateId } from "@/lib/admin/types";
import { CERTIFICATE_TEMPLATES, CertificateDesign, type CertificateData } from "./certificate-templates";
import { useCertificateSettings } from "./use-certificate-settings";
import { cn } from "@/lib/utils";

const SAMPLE: CertificateData = {
  studentName: "Student Name",
  quizTitle: "Final Examination",
  courseTitle: "Course Title",
  percentage: 92,
  score: 46,
  issuedAt: new Date().toISOString(),
  certificateNo: "NBG-CERT-2026-SAMPLE",
};

export function CertificateTemplatePicker({
  value,
  onChange,
}: {
  value?: CertificateTemplateId;
  onChange: (id: CertificateTemplateId) => void;
}) {
  const selected = value ?? "classic-maroon";
  const { settings } = useCertificateSettings();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CERTIFICATE_TEMPLATES.map((tpl) => {
        const active = selected === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange(tpl.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border-2 bg-card p-2 text-left transition",
              active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
            )}
          >
            {active && (
              <span className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
            <div className="pointer-events-none overflow-hidden rounded-lg border border-border">
              <CertificateDesign template={tpl.id} settings={settings} data={SAMPLE} />
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <div>
                <p className="text-sm font-bold text-ink">{tpl.name}</p>
                <p className="text-[11px] text-muted-foreground">{tpl.description}</p>
              </div>
              <div className="flex gap-1">
                {tpl.swatch.map((s) => (
                  <span key={s} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: s }} />
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
