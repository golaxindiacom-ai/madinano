"use client";

import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Package,
  DollarSign,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { adminFetch } from "@/lib/admin/client";
import type { DashboardStats } from "@/lib/admin/types";

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  fg,
  data,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  bg: string;
  fg: string;
  data: { v: number }[];
}) {
  const hasTrend = data.some((point) => point.v > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${bg} ${fg}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-ink">{value}</p>
      <div className="mt-3 h-12 w-full">
        {hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`sp-${label.replace(/\s+/g, "-")}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={2}
                fill={`url(#sp-${label.replace(/\s+/g, "-")})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-[10px] text-muted-foreground">No trend yet</div>
        )}
      </div>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return <p className="mt-6 text-sm text-muted-foreground">{message}</p>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<DashboardStats>("/api/admin/dashboard")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  const kpis = [
    {
      label: "Total Students",
      value: stats.totalStudents.toLocaleString(),
      icon: Users,
      color: "#7b1e2b",
      bg: "bg-maroon/10",
      fg: "text-maroon",
      data: stats.sparklines.students,
    },
    {
      label: "Total Instructors",
      value: stats.totalInstructors.toLocaleString(),
      icon: GraduationCap,
      color: "#c79a3a",
      bg: "bg-gold/15",
      fg: "text-gold",
      data: stats.sparklines.instructors,
    },
    {
      label: "Total Courses",
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      color: "#7b1e2b",
      bg: "bg-maroon/10",
      fg: "text-maroon",
      data: stats.sparklines.courses,
    },
    {
      label: "Total Enrollments",
      value: stats.totalEnrollments.toLocaleString(),
      icon: Package,
      color: "#c79a3a",
      bg: "bg-gold/15",
      fg: "text-gold",
      data: stats.sparklines.enrollments,
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "#7b1e2b",
      bg: "bg-maroon/10",
      fg: "text-maroon",
      data: stats.sparklines.revenue,
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: "#c79a3a",
      bg: "bg-gold/15",
      fg: "text-gold",
      data: stats.sparklines.orders,
    },
  ];

  const hasAnalytics = stats.analytics.some(
    (row) => row.students > 0 || row.enrollments > 0 || row.revenue > 0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live metrics from users, enrollments, orders, and payments.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-ink">
          <Calendar className="h-4 w-4 text-primary" /> {stats.periodLabel}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-ink">Overview Analytics</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            New students, enrollments, and completed payment revenue by month
          </p>
          {hasAnalytics ? (
            <div className="mt-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.analytics}>
                  <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(0,0,0,0.4)"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="rgba(0,0,0,0.4)"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgba(0,0,0,0.4)"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numeric = Number(value ?? 0);
                      if (name === "revenue") return [`₹${numeric.toLocaleString("en-IN")}`, "Revenue"];
                      if (name === "students") return [numeric, "New students"];
                      if (name === "enrollments") return [numeric, "New enrollments"];
                      return [numeric, String(name)];
                    }}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="students"
                    name="New students"
                    stroke="#7b1e2b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="enrollments"
                    name="New enrollments"
                    stroke="#c79a3a"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#2f5233"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock message="No activity in the last 6 months yet." />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-ink">Popular Courses</h3>
          <p className="mt-1 text-xs text-muted-foreground">Ranked by real enrollments</p>
          {stats.popularCourses.length ? (
            <ul className="mt-4 space-y-3">
              {stats.popularCourses.map((c) => (
                <li key={c.title} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-ink">{c.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.enrollments} enrolled · ★ {c.rating}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock message="No courses yet." />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-ink">Revenue Overview</h3>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </p>
          {stats.totalRevenue > 0 ? (
            <>
              <div className="mt-4 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.revenueBreakdown}
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="amount"
                      nameKey="name"
                      stroke="none"
                    >
                      {stats.revenueBreakdown.map((r, i) => (
                        <Cell key={i} fill={r.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                        String(name),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs">
                {stats.revenueBreakdown.map((r) => (
                  <li key={r.name} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                      {r.name}
                    </span>
                    <span className="font-semibold text-ink">
                      ₹{r.amount.toLocaleString("en-IN")} ({r.value}%)
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyBlock message="No completed payments yet." />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-ink">Enrollment Status</h3>
          {stats.totalEnrollments > 0 ? (
            <>
              <div className="mt-4 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.enrollmentBreakdown}
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="count"
                      nameKey="name"
                      stroke="none"
                    >
                      {stats.enrollmentBreakdown.map((r, i) => (
                        <Cell key={i} fill={r.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs">
                {stats.enrollmentBreakdown.map((r) => (
                  <li key={r.name} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                      {r.name}
                    </span>
                    <span className="font-semibold text-ink">
                      {r.count} ({r.value}%)
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyBlock message="No enrollments yet." />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-ink">Students by Country</h3>
          {stats.countries.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {stats.countries.map((c) => (
                <li key={c.name} className="flex justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="font-semibold">
                    {c.count} <span className="text-xs font-normal text-muted-foreground">({c.pct}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock message="No students yet." />
          )}

          <h3 className="mt-6 text-base font-bold text-ink">Recent Activities</h3>
          {stats.recentActivities.length ? (
            <ul className="mt-3 space-y-3">
              {stats.recentActivities.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-semibold text-ink">{a.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock message="No recent activity." />
          )}
        </div>
      </div>
    </div>
  );
}
