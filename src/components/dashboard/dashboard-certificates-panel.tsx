"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Eye, FileDown } from "lucide-react";
import type { Certificate } from "@/lib/admin/types";
import { getStudentSession } from "@/lib/exam/student-session";
import { CertificatePreviewModal } from "@/components/exam/certificate-preview-modal";
import { useCertificateSettings } from "@/components/exam/use-certificate-settings";

export function DashboardCertificatesPanel() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Certificate | null>(null);
  const { settings } = useCertificateSettings();

  useEffect(() => {
    const student = getStudentSession();
    if (!student) {
      setLoading(false);
      return;
    }
    fetch("/api/certificates/mine", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setCerts(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Loading certificates...</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">My Certificates</h3>
          {certs.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground">{certs.length} earned</span>
          )}
        </div>

        {certs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-8 text-center">
            <Award className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-semibold text-ink">No certificates yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Pass course exams to earn certificates with QR verification.</p>
            <Link href="/exams" className="mt-4 inline-block text-xs font-semibold text-primary">Browse Exams →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {certs.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-background/40">
                <div className="grid aspect-[1.6/1] place-items-center bg-gradient-to-br from-maroon to-forest p-4">
                  <div className="text-center text-white">
                    <Award className="mx-auto h-8 w-8 text-gold" />
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gold/90">Certificate</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold">{c.quizTitle}</p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-ink">{c.courseTitle}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {c.percentage}% · Issued {fmtDate(c.issuedAt)}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{c.certificateNo}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview(c)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-[11px] font-semibold text-primary-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <Link
                      href={`/certificates/${c.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-2 text-[11px] font-semibold text-ink"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Download
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <CertificatePreviewModal
          cert={preview}
          settings={settings}
          open={Boolean(preview)}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
