"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Receipt } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { syncSessionFromServer } from "@/lib/exam/student-session";
import type { StudentPaymentHistoryItem } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function PaymentHistoryPage() {
  const [items, setItems] = useState<StudentPaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncSessionFromServer().then((session) => {
      if (!session) {
        window.location.href = "/login?next=/dashboard/payments";
        return;
      }
      fetch("/api/payments/mine")
        .then((r) => r.json())
        .then((j) => setItems(j.data ?? []))
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <Container className="py-10">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-ink">Payment History</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your course purchases & transactions</p>

        {loading ? (
          <p className="mt-8 text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No payments yet</p>
            <Link href="/courses" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Browse courses</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{p.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{p.orderNo} · {p.methodLabel}</p>
                    {p.transactionId && <p className="font-mono text-[10px] text-muted-foreground">{p.transactionId}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink">₹{p.amount.toLocaleString("en-IN")}</p>
                  <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(p.status))}>{p.status}</span>
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
      <SiteFooter />
    </div>
  );
}
