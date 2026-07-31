"use client";

import Link from "next/link";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { PageBand, PageHero } from "@/components/page-hero";
import { useEffect, useState } from "react";
import type { FaqItem } from "@/lib/admin/types";
import { ChevronDown } from "lucide-react";

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setFaqs(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Support"
        title={
          <>
            Frequently Asked <span className="text-primary">Questions</span>
          </>
        }
        subtitle="Quick answers about courses, payments, certificates, and learning on Madinano."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQs" }]}
      />
      <PageBand tone="faq">
        <Container className="max-w-3xl">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading FAQs...</p>
          ) : faqs.length === 0 ? (
            <p className="text-center text-muted-foreground">No FAQs published yet.</p>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => {
                const isOpen = open === faq.id;
                return (
                  <div key={faq.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <span className="font-semibold text-ink">{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen ? (
                      <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Still need help?{" "}
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </Container>
      </PageBand>
      <SiteFooter />
    </main>
  );
}
