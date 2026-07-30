"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Package, ShoppingCart } from "lucide-react";
import { syncSessionFromServer } from "@/lib/exam/student-session";
import type { StudentOrderHistoryItem } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function OrderHistoryPage() {
  const [items, setItems] = useState<StudentOrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncSessionFromServer().then((session) => {
      if (!session) {
        window.location.href = "/login?next=/dashboard/orders";
        return;
      }
      fetch("/api/orders/mine")
        .then((r) => r.json())
        .then((j) => setItems(j.data ?? []))
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <>
      <h1 className="text-xl font-extrabold text-ink sm:text-2xl">My Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">Course purchase history & enrollment status</p>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading orders...</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center sm:p-10">
          <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No orders yet</p>
          <Link href="/courses" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{o.courseTitle}</p>
                    <p className="font-mono text-xs text-muted-foreground">{o.orderNo}</p>
                    {o.couponCode ? <p className="text-[10px] text-primary">Coupon: {o.couponCode}</p> : null}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  <p className="font-bold text-ink">₹{o.amount.toLocaleString("en-IN")}</p>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      statusBadge(o.status),
                    )}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className={o.hasPayment ? "text-emerald-600" : "text-amber-600"}>
                  {o.hasPayment ? "✓ Paid" : "Payment pending"}
                </span>
                <span className={o.isEnrolled ? "text-emerald-600" : "text-amber-600"}>
                  {o.isEnrolled ? "✓ Enrolled" : "Not enrolled"}
                </span>
                <span>{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                {o.isEnrolled ? (
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline sm:ml-auto"
                  >
                    <BookOpen className="h-3 w-3" /> My Courses
                  </Link>
                ) : null}
                {o.status === "completed" && o.isEnrolled ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
