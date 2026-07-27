"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  Eye,
  IndianRupee,
  Pencil,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type {
  Subscription,
  SubscriptionDetailPayload,
  SubscriptionInput,
  SubscriptionListItem,
  SubscriptionStats,
} from "@/lib/admin/types";
import { cardClass, inputClass, labelClass, selectClass } from "@/components/admin/course-form-styles";
import { cn } from "@/lib/utils";

type StudentOption = { id: string; name: string; email: string };

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

const PLAN_OPTIONS = [
  { label: "All Plans", value: "all" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Lifetime", value: "lifetime" },
];

const EMPTY_FORM: SubscriptionInput = {
  userId: "",
  studentName: "",
  studentEmail: "",
  plan: "yearly",
  amount: 4999,
  startDate: new Date().toISOString().slice(0, 10),
  status: "active",
  autoRenew: true,
};

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function statusBadge(status: Subscription["status"]) {
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

function toDateInput(iso: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function SubscriptionsListPage() {
  const [items, setItems] = useState<SubscriptionListItem[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionListItem | null>(null);
  const [form, setForm] = useState<SubscriptionInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<SubscriptionDetailPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (planFilter !== "all") params.set("plan", planFilter);
      if (expiringOnly) params.set("expiringSoon", "true");
      const q = params.toString() ? `?${params}` : "";

      const [list, st, studentList] = await Promise.all([
        adminFetch<SubscriptionListItem[]>(`/api/admin/subscriptions${q}`),
        adminFetch<SubscriptionStats>("/api/admin/subscriptions?stats=true"),
        adminFetch<StudentOption[]>("/api/admin/subscriptions?students=true"),
      ]);
      setItems(list);
      setStats(st);
      setStudents(studentList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter, expiringOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const planAmounts = useMemo(
    () => ({ monthly: 499, yearly: 4999, lifetime: 14999 }),
    [],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row: SubscriptionListItem) => {
    setEditing(row);
    setForm({
      userId: row.userId ?? "",
      studentName: row.studentName,
      studentEmail: row.studentEmail ?? "",
      plan: row.plan,
      amount: row.amount,
      startDate: toDateInput(row.startDate),
      endDate: toDateInput(row.endDate),
      status: row.status,
      autoRenew: row.autoRenew,
      paymentMethod: row.paymentMethod,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await adminFetch(`/api/admin/subscriptions/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch("/api/admin/subscriptions", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (row: SubscriptionListItem) => {
    try {
      setDetail(await adminFetch<SubscriptionDetailPayload>(`/api/admin/subscriptions/${row.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const setStatus = async (row: SubscriptionListItem, status: Subscription["status"]) => {
    if (!confirm(`Mark subscription as ${status}?`)) return;
    try {
      await adminFetch(`/api/admin/subscriptions/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const renew = async (row: SubscriptionListItem) => {
    if (!confirm(`Renew ${row.studentName}'s ${row.planLabel} plan?`)) return;
    try {
      await adminFetch(`/api/admin/subscriptions/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "renew" }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Renew failed");
    }
  };

  const remove = async (row: SubscriptionListItem) => {
    if (!confirm(`Delete subscription for ${row.studentName}?`)) return;
    try {
      await adminFetch(`/api/admin/subscriptions/${row.id}`, { method: "DELETE" });
      if (detail?.subscription.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Student", "Email", "Plan", "Amount", "Start", "End", "Days Left", "Status", "Auto Renew"];
    const rows = items.map((s) =>
      [s.studentName, s.studentEmail ?? "", s.planLabel, s.amount, s.startDate, s.endDate, s.daysRemaining, s.status, s.autoRenew ? "Yes" : "No"].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscriptions-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage premium plans, renewals & billing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/pricing" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
            <Crown className="h-4 w-4" /> Pricing Page
          </Link>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> New Subscription
          </button>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">Subscription flow:</span> Students subscribe at{" "}
        <Link href="/pricing" target="_blank" className="font-semibold text-primary underline">/pricing</Link>
        {" "}→ payment recorded → premium access. Manage renewals & cancellations here.
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
          {[
            { label: "Total", value: stats.total, icon: Repeat },
            { label: "Active", value: stats.active, icon: CheckCircle2 },
            { label: "Expired", value: stats.expired, icon: Clock },
            { label: "Cancelled", value: stats.cancelled, icon: Ban },
            { label: "Expiring", value: stats.expiringSoon, icon: Clock },
            { label: "Monthly", value: stats.monthly, icon: Crown },
            { label: "Yearly", value: stats.yearly, icon: Crown },
            { label: "Lifetime", value: stats.lifetime, icon: Crown },
            { label: "MRR", value: money(stats.mrr), icon: IndianRupee },
          ].map((item) => (
            <div key={item.label} className={cn(cardClass, "flex items-center gap-3 p-3")}>
              <item.icon className="h-5 w-5 shrink-0 text-primary/70" />
              <div>
                <p className="text-lg font-bold text-ink">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, plan..." className={cn(inputClass, "pl-9")} />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={selectClass}>
          {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input type="checkbox" checked={expiringOnly} onChange={(e) => setExpiringOnly(e.target.checked)} />
          Expiring in 7 days
        </label>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className={cn(cardClass, "overflow-x-auto")}>
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Days Left</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Auto Renew</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No subscriptions yet</td></tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{s.studentName}</p>
                    <p className="text-xs text-muted-foreground">{s.studentEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{s.planLabel}</td>
                  <td className="px-4 py-3">{money(s.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(s.startDate)} → {s.plan === "lifetime" ? "Forever" : formatDate(s.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    {s.plan === "lifetime" ? (
                      <span className="text-emerald-600 font-semibold">∞</span>
                    ) : (
                      <span className={cn("font-semibold", s.isExpiringSoon && "text-amber-600")}>{s.daysRemaining}d</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(s.status))}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{s.autoRenew ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openDetail(s)} className="rounded-md border border-border p-1.5 hover:bg-background"><Eye className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => openEdit(s)} className="rounded-md border border-border p-1.5 hover:bg-background"><Pencil className="h-3.5 w-3.5" /></button>
                      {s.status === "active" && s.plan !== "lifetime" && (
                        <button type="button" onClick={() => renew(s)} className="rounded-md border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50" title="Renew"><Repeat className="h-3.5 w-3.5" /></button>
                      )}
                      {s.status === "active" && (
                        <button type="button" onClick={() => setStatus(s, "cancelled")} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50" title="Cancel"><Ban className="h-3.5 w-3.5" /></button>
                      )}
                      <button type="button" onClick={() => remove(s)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">{editing ? "Edit Subscription" : "New Subscription"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className={labelClass}>Student</label>
                <select className={selectClass} value={form.userId} onChange={(e) => {
                  const st = students.find((s) => s.id === e.target.value);
                  setForm({ ...form, userId: e.target.value, studentName: st?.name ?? form.studentName, studentEmail: st?.email ?? form.studentEmail });
                }}>
                  <option value="">Manual entry</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {!form.userId && (
                <div>
                  <label className={labelClass}>Student Name *</label>
                  <input className={inputClass} value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Plan *</label>
                  <select className={selectClass} value={form.plan} onChange={(e) => {
                    const plan = e.target.value as Subscription["plan"];
                    setForm({ ...form, plan, amount: planAmounts[plan] });
                  }}>
                    <option value="monthly">Monthly — ₹499</option>
                    <option value="yearly">Yearly — ₹4,999</option>
                    <option value="lifetime">Lifetime — ₹14,999</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Amount (₹)</label>
                  <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start Date *</label>
                  <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Subscription["status"] })}>
                    {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} />
                Auto-renew
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-md flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{detail.subscription.planLabel} Plan</h2>
                <p className="text-xs text-muted-foreground">{detail.subscription.studentName}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">Amount</p><p className="font-semibold">{money(detail.subscription.amount)}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">Status</p><p className="font-semibold capitalize">{detail.subscription.status}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">Start</p><p className="font-semibold">{formatDate(detail.subscription.startDate)}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">End</p><p className="font-semibold">{detail.subscription.plan === "lifetime" ? "Forever" : formatDate(detail.subscription.endDate)}</p></div>
              </div>
              {detail.subscription.transactionId && (
                <p className="text-xs font-mono text-muted-foreground">TXN: {detail.subscription.transactionId}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
