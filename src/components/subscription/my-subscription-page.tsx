"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Crown, Repeat, Ban } from "lucide-react";
import { syncSessionFromServer } from "@/lib/exam/student-session";
import type { StudentSubscriptionItem, SubscriptionListItem } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "expired":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function MySubscriptionPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const params = useSearchParams();
  const [active, setActive] = useState<SubscriptionListItem | null>(null);
  const [history, setHistory] = useState<StudentSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const success = params.get("success") === "1";

  const load = () => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      fetch("/api/subscriptions/mine?active=true", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/subscriptions/mine", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([activeRes, histRes]) => {
        setActive(activeRes.data ?? null);
        setHistory(histRes.data ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    syncSessionFromServer().then((session) => {
      if (!session) {
        window.location.href = "/login?next=/dashboard/subscription";
        return;
      }
      setStudentId(session.id);
    });
  }, []);

  useEffect(() => {
    if (studentId) load();
  }, [studentId]);

  const cancel = async () => {
    if (!active || !studentId) return;
    if (!confirm("Cancel your subscription? Premium access will end at the current period.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/mine", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", subscriptionId: active.id }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-extrabold text-ink sm:text-2xl">My Subscription</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your premium plan</p>

      {success ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> Subscription activated successfully!
        </div>
      ) : null}

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : active ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5 p-4 sm:mt-8 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Current Plan</p>
                <h2 className="text-lg font-extrabold text-ink sm:text-xl">{active.planLabel}</h2>
                <p className="text-sm text-muted-foreground">₹{active.amount.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <span
              className={cn(
                "w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                statusBadge(active.status),
              )}
            >
              {active.status}
            </span>
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card/80 p-3">
              <p className="text-muted-foreground">Started</p>
              <p className="font-semibold">{new Date(active.startDate).toLocaleDateString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/80 p-3">
              <p className="text-muted-foreground">{active.plan === "lifetime" ? "Access" : "Renews / Ends"}</p>
              <p className="font-semibold">
                {active.plan === "lifetime" ? "Forever" : new Date(active.endDate).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/80 p-3">
              <p className="text-muted-foreground">Days Remaining</p>
              <p className="font-semibold">{active.plan === "lifetime" ? "∞" : `${active.daysRemaining} days`}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {active.autoRenew && active.plan !== "lifetime" ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3.5 w-3.5" /> Auto-renew enabled
              </span>
            ) : null}
            {active.plan !== "lifetime" ? (
              <button
                type="button"
                onClick={cancel}
                disabled={cancelling}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <Ban className="h-3.5 w-3.5" /> {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center sm:p-10">
          <Crown className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold text-ink">No active subscription</p>
          <p className="mt-1 text-sm text-muted-foreground">Upgrade to unlock all premium features</p>
          <Link
            href="/pricing"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            View Plans
          </Link>
        </div>
      )}

      {history.length > 0 ? (
        <div className="mt-8 sm:mt-10">
          <h3 className="font-bold text-ink">Subscription History</h3>
          <div className="mt-4 space-y-2">
            {history.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{s.planLabel}</p>
                  <p className="text-xs text-muted-foreground">₹{s.amount.toLocaleString("en-IN")}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    statusBadge(s.status),
                  )}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
