"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  IndianRupee,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type {
  Order,
  OrderDetailPayload,
  OrderListItem,
  OrderStats,
  Payment,
  PaymentDetailPayload,
  PaymentListItem,
  PaymentStats,
} from "@/lib/admin/types";
import { cardClass, inputClass } from "@/components/admin/course-form-styles";
import {
  adminPageClass,
  adminKpiGridClass,
  adminFilterBarClass,
  adminFilterSelectClass,
  adminTabBarClass,
  AdminPageHeader,
  AdminDesktopTable,
  AdminMobileList,
  AdminMobileCard,
  AdminMobileRow,
  AdminMobileActions,
  AdminLoadingState,
  AdminEmptyState,
} from "@/components/admin/admin-layout";
import { cn } from "@/lib/utils";

type CourseOption = { id: string; title: string; sellingPrice: number };
type MethodOption = { value: string; label: string };

const PAYMENT_STATUS = [
  { label: "All Status", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const ORDER_STATUS = [
  { label: "All Status", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function payStatusBadge(status: Payment["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function orderStatusBadge(status: Order["status"]) {
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

type Props = { defaultTab?: "payments" | "orders" };

export function PaymentsOrdersPage({ defaultTab = "payments" }: Props) {
  const [tab, setTab] = useState<"payments" | "orders">(defaultTab);
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [payStats, setPayStats] = useState<PaymentStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [methods, setMethods] = useState<MethodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [payStatus, setPayStatus] = useState("all");
  const [payMethod, setPayMethod] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [payDetail, setPayDetail] = useState<PaymentDetailPayload | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetailPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payParams = new URLSearchParams();
      if (search) payParams.set("search", search);
      if (payStatus !== "all") payParams.set("status", payStatus);
      if (payMethod !== "all") payParams.set("method", payMethod);
      const payQ = payParams.toString() ? `?${payParams}` : "";

      const orderParams = new URLSearchParams();
      if (search) orderParams.set("search", search);
      if (orderStatus !== "all") orderParams.set("status", orderStatus);
      if (courseFilter) orderParams.set("courseId", courseFilter);
      const orderQ = orderParams.toString() ? `?${orderParams}` : "";

      const [payList, ordList, ps, os, courseList, methodList] = await Promise.all([
        adminFetch<PaymentListItem[]>(`/api/admin/payments${payQ}`),
        adminFetch<OrderListItem[]>(`/api/admin/orders${orderQ}`),
        adminFetch<PaymentStats>("/api/admin/payments?stats=true"),
        adminFetch<OrderStats>("/api/admin/orders?stats=true"),
        adminFetch<CourseOption[]>("/api/admin/payments?courses=true"),
        adminFetch<MethodOption[]>("/api/admin/payments?methods=true"),
      ]);
      setPayments(payList);
      setOrders(ordList);
      setPayStats(ps);
      setOrderStats(os);
      setCourses(courseList);
      setMethods(methodList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, payStatus, payMethod, orderStatus, courseFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openPayDetail = async (row: PaymentListItem) => {
    try {
      setPayDetail(await adminFetch<PaymentDetailPayload>(`/api/admin/payments/${row.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payment");
    }
  };

  const openOrderDetail = async (row: OrderListItem) => {
    try {
      setOrderDetail(await adminFetch<OrderDetailPayload>(`/api/admin/orders/${row.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load order");
    }
  };

  const updatePayStatus = async (row: PaymentListItem, status: Payment["status"]) => {
    if (!confirm(`Mark payment ${row.transactionId ?? row.id} as ${status}?`)) return;
    try {
      await adminFetch(`/api/admin/payments/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const updateOrderStatus = async (row: OrderListItem, status: Order["status"]) => {
    if (!confirm(`Mark order ${row.orderNo} as ${status}?`)) return;
    try {
      await adminFetch(`/api/admin/orders/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const removeOrder = async (row: OrderListItem) => {
    if (!confirm(`Delete order ${row.orderNo}?`)) return;
    try {
      await adminFetch(`/api/admin/orders/${row.id}`, { method: "DELETE" });
      if (orderDetail?.order.id === row.id) setOrderDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    if (tab === "payments") {
      const headers = ["Transaction", "Order", "Student", "Course", "Amount", "Method", "Status", "Date"];
      const rows = payments.map((p) =>
        [p.transactionId ?? "", p.orderNo, p.studentName, p.courseTitle ?? "", p.amount, p.methodLabel, p.status, p.createdAt].join(","),
      );
      downloadCsv("payments-export.csv", headers, rows);
    } else {
      const headers = ["Order No", "Student", "Course", "Amount", "Coupon", "Payment", "Status", "Date"];
      const rows = orders.map((o) =>
        [o.orderNo, o.studentName, o.courseTitle, o.amount, o.couponCode ?? "", o.hasPayment ? "Yes" : "No", o.status, o.createdAt].join(","),
      );
      downloadCsv("orders-export.csv", headers, rows);
    }
  };

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Payments & Orders"
        description="Track revenue, transactions & course purchases"
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </>
        }
      />

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">Payment flow:</span> Students checkout from course pages → order created → payment processed → auto-enrollment.
      </div>

      <div className={adminTabBarClass}>
        <button
          type="button"
          onClick={() => setTab("payments")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold",
            tab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground",
          )}
        >
          <CreditCard className="h-4 w-4" /> Payments
        </button>
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold",
            tab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground",
          )}
        >
          <ShoppingCart className="h-4 w-4" /> Orders
        </button>
      </div>

      {tab === "payments" && payStats && (
        <div className={adminKpiGridClass}>
          {[
            { label: "Total", value: payStats.total, icon: CreditCard },
            { label: "Completed", value: payStats.completed, icon: CheckCircle2 },
            { label: "Pending", value: payStats.pending, icon: ShoppingCart },
            { label: "Failed", value: payStats.failed, icon: Ban },
            { label: "Refunded", value: payStats.refunded, icon: RotateCcw },
            { label: "Revenue", value: money(payStats.totalRevenue), icon: IndianRupee },
            { label: "Today", value: money(payStats.todayRevenue), icon: IndianRupee },
            { label: "This Month", value: money(payStats.thisMonthRevenue), icon: IndianRupee },
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

      {tab === "orders" && orderStats && (
        <div className={adminKpiGridClass}>
          {[
            { label: "Total Orders", value: orderStats.total, icon: ShoppingCart },
            { label: "Completed", value: orderStats.completed, icon: CheckCircle2 },
            { label: "Pending", value: orderStats.pending, icon: ShoppingCart },
            { label: "Cancelled", value: orderStats.cancelled, icon: Ban },
            { label: "Refunded", value: orderStats.refunded, icon: RotateCcw },
            { label: "Order Value", value: money(orderStats.totalValue), icon: IndianRupee },
            { label: "Avg Order", value: money(orderStats.averageOrderValue), icon: IndianRupee },
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

      <div className={cn("rounded-2xl border border-border bg-card p-4", adminFilterBarClass)}>
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className={cn(inputClass, "pl-9")} />
        </div>
        {tab === "payments" ? (
          <>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={adminFilterSelectClass}>
              <option value="all">All Methods</option>
              {methods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)} className={adminFilterSelectClass}>
              {PAYMENT_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </>
        ) : (
          <>
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={adminFilterSelectClass}>
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={adminFilterSelectClass}>
              {ORDER_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {tab === "payments" ? (
        <>
          <AdminDesktopTable>
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No payments yet</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold">{p.transactionId ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{p.orderNo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{p.studentName}</p>
                        <p className="text-xs text-muted-foreground">{p.studentEmail}</p>
                      </td>
                      <td className="px-4 py-3">{p.courseTitle ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold">{money(p.amount)}</td>
                      <td className="px-4 py-3">{p.methodLabel}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", payStatusBadge(p.status))}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openPayDetail(p)} className="rounded-md border border-border p-1.5 hover:bg-background"><Eye className="h-3.5 w-3.5" /></button>
                          {p.status === "completed" && (
                            <button type="button" onClick={() => updatePayStatus(p, "refunded")} className="rounded-md border border-border p-1.5 hover:bg-background" title="Refund"><RotateCcw className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminDesktopTable>
          <AdminMobileList>
            {loading ? (
              <AdminLoadingState message="Loading..." />
            ) : payments.length === 0 ? (
              <AdminEmptyState message="No payments yet" />
            ) : (
              payments.map((p) => (
                <AdminMobileCard key={p.id}>
                  <p className="font-mono text-xs font-semibold text-ink">{p.transactionId ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{p.orderNo}</p>
                  <div className="mt-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", payStatusBadge(p.status))}>{p.status}</span>
                  </div>
                  <AdminMobileRow label="Student">{p.studentName}</AdminMobileRow>
                  <AdminMobileRow label="Course">{p.courseTitle ?? "—"}</AdminMobileRow>
                  <AdminMobileRow label="Amount">{money(p.amount)}</AdminMobileRow>
                  <AdminMobileRow label="Method">{p.methodLabel}</AdminMobileRow>
                  <AdminMobileRow label="Date">{formatDate(p.createdAt)}</AdminMobileRow>
                  <AdminMobileActions>
                    <button type="button" onClick={() => openPayDetail(p)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    {p.status === "completed" && (
                      <button type="button" onClick={() => updatePayStatus(p, "refunded")} className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </AdminMobileActions>
                </AdminMobileCard>
              ))
            )}
          </AdminMobileList>
        </>
      ) : (
        <>
          <AdminDesktopTable>
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No orders yet</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{o.orderNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{o.studentName}</p>
                        {o.couponCode && <p className="text-[10px] text-primary">Coupon: {o.couponCode}</p>}
                      </td>
                      <td className="px-4 py-3">{o.courseTitle}</td>
                      <td className="px-4 py-3 font-semibold">{money(o.amount)}</td>
                      <td className="px-4 py-3 text-xs">
                        {o.hasPayment ? (
                          <span className="text-emerald-600">{o.methodLabel} · {o.paymentStatus}</span>
                        ) : (
                          <span className="text-muted-foreground">No payment</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", orderStatusBadge(o.status))}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openOrderDetail(o)} className="rounded-md border border-border p-1.5 hover:bg-background"><Eye className="h-3.5 w-3.5" /></button>
                          {o.status === "pending" && (
                            <>
                              <button type="button" onClick={() => updateOrderStatus(o, "cancelled")} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50" title="Cancel"><Ban className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={() => removeOrder(o)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminDesktopTable>
          <AdminMobileList>
            {loading ? (
              <AdminLoadingState message="Loading..." />
            ) : orders.length === 0 ? (
              <AdminEmptyState message="No orders yet" />
            ) : (
              orders.map((o) => (
                <AdminMobileCard key={o.id}>
                  <p className="font-mono text-xs font-semibold text-ink">{o.orderNo}</p>
                  <p className="font-semibold text-ink">{o.studentName}</p>
                  <div className="mt-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", orderStatusBadge(o.status))}>{o.status}</span>
                  </div>
                  <AdminMobileRow label="Course">{o.courseTitle}</AdminMobileRow>
                  <AdminMobileRow label="Amount">{money(o.amount)}</AdminMobileRow>
                  <AdminMobileRow label="Payment">
                    {o.hasPayment ? `${o.methodLabel} · ${o.paymentStatus}` : "No payment"}
                  </AdminMobileRow>
                  <AdminMobileRow label="Date">{formatDate(o.createdAt)}</AdminMobileRow>
                  <AdminMobileActions>
                    <button type="button" onClick={() => openOrderDetail(o)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    {o.status === "pending" && (
                      <>
                        <button type="button" onClick={() => updateOrderStatus(o, "cancelled")} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeOrder(o)} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </AdminMobileActions>
                </AdminMobileCard>
              ))
            )}
          </AdminMobileList>
        </>
      )}

      {payDetail && (
        <DetailDrawer title={payDetail.payment.transactionId ?? "Payment"} subtitle={payDetail.payment.orderNo} onClose={() => setPayDetail(null)}>
          <DetailGrid items={[
            ["Student", payDetail.payment.studentName],
            ["Amount", money(payDetail.payment.amount)],
            ["Method", payDetail.payment.methodLabel],
            ["Status", payDetail.payment.status],
            ["Course", payDetail.payment.courseTitle ?? "—"],
            ["Date", formatDate(payDetail.payment.createdAt)],
          ]} />
          {payDetail.order && (
            <p className="text-sm text-muted-foreground">Linked order: <span className="font-semibold text-ink">{payDetail.order.orderNo}</span></p>
          )}
        </DetailDrawer>
      )}

      {orderDetail && (
        <DetailDrawer title={orderDetail.order.orderNo} subtitle={orderDetail.order.studentName} onClose={() => setOrderDetail(null)}>
          <DetailGrid items={[
            ["Course", orderDetail.order.courseTitle],
            ["Amount", money(orderDetail.order.amount)],
            ["Discount", orderDetail.order.discount ? money(orderDetail.order.discount) : "—"],
            ["Coupon", orderDetail.order.couponCode ?? "—"],
            ["Status", orderDetail.order.status],
            ["Date", formatDate(orderDetail.order.createdAt)],
          ]} />
          {orderDetail.payment ? (
            <p className="text-sm text-muted-foreground">
              Payment: <span className="font-semibold text-ink">{orderDetail.payment.transactionId}</span> ({orderDetail.payment.status})
            </p>
          ) : (
            <p className="text-sm text-amber-600">No payment recorded for this order</p>
          )}
        </DetailDrawer>
      )}
    </div>
  );
}

function DetailDrawer({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-md flex-col bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function DetailGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-muted/40 p-3">
          <p className="text-muted-foreground">{label}</p>
          <p className="font-semibold capitalize">{value}</p>
        </div>
      ))}
    </div>
  );
}

function downloadCsv(filename: string, headers: string[], rows: string[]) {
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
