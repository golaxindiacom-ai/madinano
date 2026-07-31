"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldX, Award } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type VerifyResult = {
  valid: boolean;
  certificateNo: string;
  studentName: string;
  quizTitle: string;
  courseTitle: string;
  percentage: number;
  issuedAt: string;
  status: string;
  qrCodeDataUrl?: string;
  id: string;
};

export function CertificateVerifyPage({ certNo }: { certNo: string }) {
  const [data, setData] = useState<VerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/certificates/verify/${encodeURIComponent(certNo)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        else setNotFound(true);
      });
  }, [certNo]);

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Credentials"
        title={
          <>
            Certificate <span className="text-primary">Verification</span>
          </>
        }
        subtitle="Verify authenticity of Madinano certificates"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Verify Certificate" }]}
      />
      <PageBand tone="faq">
        <Container className="max-w-lg">
          {notFound ? (
            <div className="rounded-xl border border-red-200 bg-card p-8 text-center shadow-card">
              <ShieldX className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 font-bold text-red-800">Certificate Not Found</p>
              <p className="mt-2 text-sm text-red-600">No valid certificate matches: {certNo}</p>
            </div>
          ) : null}

          {data ? (
            <div
              className={cn(
                "rounded-xl border bg-card p-8 shadow-card",
                data.valid ? "border-emerald-200" : "border-red-200",
              )}
            >
              {data.valid ? (
                <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500" />
              ) : (
                <ShieldX className="mx-auto h-12 w-12 text-red-500" />
              )}
              <p
                className={cn(
                  "mt-4 text-center text-lg font-bold",
                  data.valid ? "text-emerald-800" : "text-red-800",
                )}
              >
                {data.valid ? "✓ Valid Certificate" : "Revoked Certificate"}
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">Certificate No</dt>
                  <dd className="font-mono font-semibold">{data.certificateNo}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">Student</dt>
                  <dd className="font-semibold">{data.studentName}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">Exam</dt>
                  <dd className="font-semibold">{data.quizTitle}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">Course</dt>
                  <dd className="font-semibold">{data.courseTitle}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">Score</dt>
                  <dd className="font-semibold">{data.percentage}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd className="font-semibold">{new Date(data.issuedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
              {data.valid ? (
                <Link
                  href={`/certificates/${data.id}`}
                  className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-primary"
                >
                  <Award className="h-4 w-4" /> View Full Certificate
                </Link>
              ) : null}
            </div>
          ) : !notFound ? (
            <p className="text-center text-muted-foreground">Verifying certificate...</p>
          ) : null}
        </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}
