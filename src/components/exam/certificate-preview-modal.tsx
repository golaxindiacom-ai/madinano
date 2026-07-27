"use client";

import Link from "next/link";
import { Download, ExternalLink, X } from "lucide-react";
import type { Certificate, CertificateSettings } from "@/lib/admin/types";
import { CertificateDesign } from "@/components/exam/certificate-templates";
import { downloadCertificatePdfFromElement } from "@/lib/exam/certificate-pdf";

type Props = {
  cert: Certificate;
  settings: CertificateSettings;
  open: boolean;
  onClose: () => void;
};

export function CertificatePreviewModal({ cert, settings, open, onClose }: Props) {
  if (!open) return null;

  const downloadPdf = async () => {
    try {
      await downloadCertificatePdfFromElement("certificate-preview-print", `${cert.certificateNo}.pdf`);
    } catch {
      /* preview element may not be ready */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold text-ink">Certificate Preview</p>
            <p className="text-xs text-muted-foreground">{cert.quizTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadPdf} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
            <Link href={`/certificates/${cert.id}`} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold">
              <ExternalLink className="h-3.5 w-3.5" /> Full Page
            </Link>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          <div id="certificate-preview-print" className="overflow-hidden rounded-xl shadow-lg">
            <CertificateDesign
              template={cert.template}
              settings={settings}
              data={{
                studentName: cert.studentName,
                quizTitle: cert.quizTitle,
                courseTitle: cert.courseTitle,
                percentage: cert.percentage,
                score: cert.score,
                issuedAt: cert.issuedAt,
                certificateNo: cert.certificateNo,
                qrCodeDataUrl: cert.qrCodeDataUrl,
                verifyUrl: cert.verifyUrl,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
