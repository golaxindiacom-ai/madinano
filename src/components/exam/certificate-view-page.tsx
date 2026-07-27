"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileDown, Link2, ShieldCheck } from "lucide-react";
import type { Certificate } from "@/lib/admin/types";
import { downloadCertificatePdf, downloadCertificatePdfFromElement } from "@/lib/exam/certificate-pdf";
import { CertificateDesign } from "@/components/exam/certificate-templates";
import { useCertificateSettings } from "@/components/exam/use-certificate-settings";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";

export function CertificateViewPage({ certId }: { certId: string }) {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { settings } = useCertificateSettings();

  useEffect(() => {
    fetch(`/api/certificates/${certId}`).then((r) => r.json()).then((j) => setCert(j.data));
  }, [certId]);

  const downloadPdf = async () => {
    if (!cert) return;
    setPdfLoading(true);
    try {
      try {
        await downloadCertificatePdfFromElement("certificate-print-area", `${cert.certificateNo}.pdf`);
      } catch {
        await downloadCertificatePdf(cert);
      }
    } finally {
      setPdfLoading(false);
    }
  };

  if (!cert) return <div className="flex min-h-screen items-center justify-center">Loading certificate...</div>;

  const shareUrl = cert.verifyUrl || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = `I earned a certificate for "${cert.quizTitle}" from Navbharat Gurukulam! 🎓`;
  const enc = encodeURIComponent;
  const shareLinks = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${shareText} ${shareUrl}`)}`, color: "bg-[#25D366]" },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`, color: "bg-[#0A66C2]" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`, color: "bg-[#1877F2]" },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(shareUrl)}`, color: "bg-slate-900" },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <SiteTopBar />
        <SiteHeader />
      </div>
      <main className="py-10 print:py-0">
        <Container className="max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
            <button type="button" onClick={downloadPdf} disabled={pdfLoading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              <FileDown className="h-4 w-4" /> {pdfLoading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold">
              <Download className="h-4 w-4" /> Print
            </button>
            <Link href={`/certificates/verify/${cert.certificateNo}`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" /> Verify
            </Link>
            <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold">
              <Link2 className="h-4 w-4" /> {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden">
            <span className="text-sm font-semibold text-muted-foreground">Share:</span>
            {shareLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 ${s.color}`}
              >
                {s.label}
              </a>
            ))}
          </div>

          <div id="certificate-print-area" className="overflow-hidden rounded-2xl shadow-xl">
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
        </Container>
      </main>
      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}
