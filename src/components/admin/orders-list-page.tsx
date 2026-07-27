"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  IndianRupee,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type {
  Order,
  OrderDetailPayload,
  OrderInput,
  OrderListItem,
  OrderStats,
  Payment,
} from "@/lib/admin/types";
import {
  cardClass,
  helperClass,
  inputClass,
  labelClass,
  selectClass,
} from "@/components/admin/course-form-styles";
import { cn } from "@/lib/utils";

type CourseOption = { id: string; title: string; sellingPrice: number };
type StudentOption = { id: string; name: string; email: string };

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

const FULFILL_METHODS: Payment["method"][] = ["upi", "card", "paypal", "bank"];

const EMPTY_FORM: OrderInput = {
  userId: "",
  studentName: "",
  studentEmail: "",
  courseId: "",
  amount: 0,
  discount: 0,
  couponCode: "",
  status: "pending",
};

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function statusBadge(status: Order["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function OrdersListPage() {
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [awaitingEnrollment, setAwaitingEnrollment] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<OrderInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<OrderDetailPayload | null>(null);
  const [fulfillMethod, setFulfillMethod] = useState<Payment["method"]>("upi");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      if (awaitingPayment) params.set("awaitingPayment", "true");
      if (awaitingEnrollment) params.set("awaitingEnrollment", "true");
      const q = params.toString() ? `?${params}` : "";

      const [list, st, courseList, studentList] = await Promise.all([
        adminFetch<OrderListItem[]>(`/api/admin/orders${q}`),
        adminFetch<OrderStats>("/api/admin/orders?stats=true"),
        adminFetch<CourseOption[]>("/api/admin/orders?courses=true"),
        adminFetch<StudentOption[]>("/api/admin/orders?students=true"),
      ]);
      setItems(list);
      setStats(st);
      setCourses(courseList);
      setStudents(studentList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, courseFilter, awaitingPayment, awaitingEnrollment]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseId),
    [courses, form.courseId],
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === form.userId),
    [students, form.userId],
  );

  useEffect(() => {
    if (selectedCourse && !form.amount) {
      setForm((f) => ({ ...f, amount: selectedCourse.sellingPrice }));
    }
  }, [selectedCourse, form.amount]);

  useEffect(() => {
    if (selectedStudent) {
      setForm((f) => ({
        ...f,
        studentName: selectedStudent.name,
        studentEmail: selectedStudent.email,
      }));
    }
  }, [selectedStudent]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await adminFetch("/api/admin/orders", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (row: OrderListItem) => {
    try {
      setDetail(await adminFetch<OrderDetailPayload>(`/api/admin/orders/${row.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const fulfill = async (row: OrderListItem) => {
    if (!confirm(`Fulfill order ${row.orderNo}? This records payment and enrolls the student.`)) return;
    try {
      await adminFetch(`/api/admin/orders/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "fulfill", method: fulfillMethod, enroll: true }),
      });
      load();
      if (detail?.order.id === row.id) openDetail(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fulfill failed");
    }
  };

  const enroll = async (row: OrderListItem) => {
    try {
      await adminFetch(`/api/admin/orders/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "enroll" }),
      });
      load();
      if (detail?.order.id === row.id) openDetail(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrollment failed");
    }
  };

  const setStatus = async (row: OrderListItem, status: Order["status"]) => {
    if (!confirm(`Mark order ${row.orderNo} as ${status}?`)) return;
    try {
      await adminFetch(`/api/admin/orders/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  };

  const remove = async (row: OrderListItem) => {
    if (!confirm(`Delete order ${row.orderNo}?`)) return;
    try {
      await adminFetch(`/api/admin/orders/${row.id}`, { method: "DELETE" });
      if (detail?.order.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Order No", "Student", "Email", "Course", "Amount", "Coupon", "Payment", "Enrolled", "Status", "Date"];
    const rows = items.map((o) =>
      [o.orderNo, o.studentName, o.studentEmail ?? "", o.courseTitle, o.amount, o.couponCode ?? "", o.hasPayment ? "Yes" : "No", o.isEnrolled ? "Yes" : "No", o.status, o.createdAt].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage course purchases, fulfillment & enrollment
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> New Order
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
        <span className="font-semibold">Order lifecycle:</span>{" "}
        Checkout creates pending order → payment completes order → student enrolled. Pending orders can be{" "}
        <strong>fulfilled</strong> manually from admin. View payments in{" "}
        <Link href="/admin/payments" className="font-semibold text-primary underline">Payments</Link>.
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
          {[
            { label: "Total", value: stats.total, icon: ShoppingCart },
            { label: "Completed", value: stats.completed, icon: CheckCircle2 },
            { label: "Pending", value: stats.pending, icon: Package },
            { label: "Cancelled", value: stats.cancelled, icon: Ban },
            { label: "Refunded", value: stats.refunded, icon: Ban },
            { label: "Awaiting Pay", value: stats.awaitingPayment, icon: CreditCard },
            { label: "Awaiting Enroll", value: stats.awaitingEnrollment, icon: UserPlus },
            { label: "Order Value", value: money(stats.totalValue), icon: IndianRupee },
            { label: "Avg Order", value: money(stats.averageOrderValue), icon: IndianRupee },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order no, student, course..." className={cn(inputClass, "pl-9")} />
        </div>
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectClass}>
          <option value="">All Courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={fulfillMethod} onChange={(e) => setFulfillMethod(e.target.value as Payment["method"])} className={selectClass} title="Default fulfill payment method">
          {FULFILL_METHODS.map((m) => <option key={m} value={m}>Fulfill via {m.toUpperCase()}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input type="checkbox" checked={awaitingPayment} onChange={(e) => setAwaitingPayment(e.target.checked)} />
          Awaiting payment
        </label>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input type="checkbox" checked={awaitingEnrollment} onChange={(e) => setAwaitingEnrollment(e.target.checked)} />
          Awaiting enroll
        </label>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className={cn(cardClass, "overflow-x-auto")}>
        <table className="w-full min-w-[1150px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading orders...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No orders yet</td></tr>
            ) : (
              items.map((o) => (
                <tr key={o.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{o.orderNo}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{o.studentName}</p>
                    <p className="text-xs text-muted-foreground">{o.studentEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.courseTitle}</p>
                    {o.couponCode && <p className="text-[10px] text-primary">Coupon: {o.couponCode}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{money(o.amount)}</td>
                  <td className="px-4 py-3 text-xs">
                    {o.hasPayment ? (
                      <span className="text-emerald-600">{o.methodLabel} · {o.paymentStatus}</span>
                    ) : (
                      <span className="text-amber-600">Unpaid</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.isEnrolled ? (
                      <span className="text-emerald-600 text-xs font-semibold">Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(o.status))}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openDetail(o)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Details"><Eye className="h-3.5 w-3.5" /></button>
                      {(o.status === "pending" || (o.status === "completed" && !o.isEnrolled)) && (
                        <button type="button" onClick={() => fulfill(o)} className="rounded-md border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50" title="Fulfill"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                      )}
                      {o.status === "completed" && !o.isEnrolled && o.userId && (
                        <button type="button" onClick={() => enroll(o)} className="rounded-md border border-primary/30 p-1.5 text-primary hover:bg-primary/5" title="Enroll"><UserPlus className="h-3.5 w-3.5" /></button>
                      )}
                      {o.status === "pending" && (
                        <>
                          <button type="button" onClick={() => setStatus(o, "cancelled")} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50" title="Cancel"><Ban className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => remove(o)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                      {o.status === "completed" && (
                        <button type="button" onClick={() => setStatus(o, "refunded")} className="rounded-md border border-border p-1.5 hover:bg-background" title="Refund">↩</button>
                      )}
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
              <h2 className="text-lg font-bold text-ink">Create Order</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className={labelClass}>Student</label>
                <select className={selectClass} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Manual entry</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {!form.userId && (
                <>
                  <div>
                    <label className={labelClass}>Student Name *</label>
                    <input className={inputClass} value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input className={inputClass} value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} />
                  </div>
                </>
              )}
              <div>
                <label className={labelClass}>Course *</label>
                <select className={selectClass} value={form.courseId} onChange={(e) => {
                  const c = courses.find((x) => x.id === e.target.value);
                  setForm({ ...form, courseId: e.target.value, amount: c?.sellingPrice ?? form.amount });
                }}>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title} — ₹{c.sellingPrice}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Amount (₹) *</label>
                  <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Order["status"] })}>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Coupon Code</label>
                <input className={inputClass} value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} />
                <p className={helperClass}>Optional — discount not auto-calculated for manual orders</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {saving ? "Creating..." : "Create Order"}
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
                <h2 className="text-lg font-bold text-ink">{detail.order.orderNo}</h2>
                <p className="text-xs text-muted-foreground">{detail.order.studentName}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">Course</p><p className="font-semibold">{detail.order.courseTitle}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">Amount</p><p className="font-semibold">{money(detail.order.amount)}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">Status</p><p className="font-semibold capitalize">{detail.order.status}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-muted-foreground">Date</p><p className="font-semibold">{formatDate(detail.order.createdAt)}</p></div>
              </div>
              {detail.order.couponCode && (
                <p className="text-sm">Coupon: <span className="font-semibold text-primary">{detail.order.couponCode}</span></p>
              )}
              <div>
                <p className="text-sm font-semibold text-ink">Payment</p>
                {detail.payment ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {detail.payment.transactionId} · {detail.payment.methodLabel} · {detail.payment.status}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-amber-600">No payment recorded</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Enrollment</p>
                {detail.enrollment ? (
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>Enrolled · {detail.enrollment.progress}% progress</p>
                    {detail.order.courseId && (
                      <Link href={`/courses/${detail.order.courseId}/learn`} target="_blank" className="text-xs font-semibold text-primary hover:underline">
                        Open course →
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-amber-600">Not enrolled yet</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              {(detail.order.status === "pending" || !detail.order.isEnrolled) && (
                <button type="button" onClick={() => { fulfill(detail.order); }} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">
                  Fulfill Order
                </button>
              )}
              <Link href="/admin/payments" className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-semibold">
                View Payments
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
