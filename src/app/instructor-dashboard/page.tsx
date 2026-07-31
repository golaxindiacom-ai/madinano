"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { images } from "@/lib/images";
import type { InstructorDashboardPayload } from "@/lib/admin/types";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Home,
  BookOpen,
  Video,
  Users,
  DollarSign,
  MessageSquare,
  Star,
  BarChart3,
  User,
  Settings,
  Search,
  ChevronRight,
  TrendingUp,
  Plus,
  Eye,
  PlayCircle,
  Award,
  Sparkles,
  ClipboardList,
  AlertCircle,
} from "lucide-react";

const GRADIENTS = [
  "from-maroon to-primary",
  "from-primary to-gold",
  "from-maroon to-gold",
  "from-gold to-maroon",
];

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function relativeJoined(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function firstName(name: string) {
  return name.split(" ")[0] || name;
}

export default function InstructorDashboardPage() {
  const [data, setData] = useState<InstructorDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/instructor/dashboard?slug=john-smith", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || json?.success === false) {
          throw new Error(json?.error || "Unable to load instructor dashboard");
        }
        setData(json.data);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load instructor dashboard");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const sidebar = useMemo(
    () => ({
      main: [{ icon: Home, label: "Dashboard", active: true, href: "/instructor-dashboard" }],
      teach: [
        { icon: BookOpen, label: "My Courses", href: "/admin/courses" },
        { icon: Plus, label: "Create Course", href: "/admin/courses/new" },
        { icon: ClipboardList, label: "My Quizzes", href: "/instructor-dashboard/quizzes" },
        { icon: Video, label: "Live Sessions", href: "/live-classes" },
        { icon: Users, label: "Students", badge: data?.kpis.totalStudents },
        { icon: MessageSquare, label: "Q & A" },
        { icon: Star, label: "Reviews" },
      ],
      business: [
        { icon: DollarSign, label: "Earnings" },
        { icon: BarChart3, label: "Analytics" },
        { icon: Award, label: "Certifications", href: "/admin/certificates" },
      ],
      account: [
        { icon: User, label: "Profile", href: "/instructors/john-smith" },
        { icon: Settings, label: "Account & Password", href: "/instructor-dashboard/account" },
      ],
    }),
    [data?.kpis.totalStudents],
  );

  const kpis = data
    ? [
        {
          icon: Users,
          label: "Total Students",
          value: data.kpis.totalStudents.toLocaleString("en-IN"),
          delta: `${data.recentStudents.length} recent enrollments`,
          tint: "from-maroon/15 to-maroon/5",
          ring: "text-maroon",
        },
        {
          icon: BookOpen,
          label: "Active Courses",
          value: String(data.kpis.activeCourses),
          delta: `${data.myCourses.length} total courses`,
          tint: "from-gold/20 to-gold/5",
          ring: "text-gold",
        },
        {
          icon: DollarSign,
          label: "Total Earnings",
          value: formatINR(data.kpis.totalEarnings),
          delta: "From completed payments",
          tint: "from-maroon/15 to-maroon/5",
          ring: "text-maroon",
        },
        {
          icon: Star,
          label: "Avg. Rating",
          value: data.kpis.avgRating.toFixed(1),
          delta: `${data.kpis.reviews.toLocaleString("en-IN")} learners`,
          tint: "from-gold/20 to-gold/5",
          ring: "text-gold",
        },
        {
          icon: PlayCircle,
          label: "Published",
          value: String(data.myCourses.filter((c) => c.status === "Published").length),
          delta: "Live on catalog",
          tint: "from-maroon/15 to-maroon/5",
          ring: "text-maroon",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur lg:flex">
          <Link href="/" className="flex items-center gap-2.5 border-b border-border px-6 py-5">
            <img
              src={images.logo}
              alt="Madinano"
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold text-ink">
                Madinano <span className="text-primary">Global</span>
              </span>
              <span className="block text-[10px] text-muted-foreground">Instructor Portal</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5 text-sm">
            <div className="space-y-1">{sidebar.main.map((i) => <NavItem key={i.label} {...i} />)}</div>
            <NavGroup title="Teaching" items={sidebar.teach} />
            <NavGroup title="Business" items={sidebar.business} />
            <NavGroup title="Account" items={sidebar.account} />
          </nav>

          <div className="mx-4 mb-4 rounded-2xl border border-maroon/25 bg-gradient-to-br from-maroon/15 to-gold/10 p-4 text-center">
            <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-maroon/10">
              <Sparkles className="h-5 w-5 text-maroon" />
            </div>
            <div className="text-sm font-bold text-ink">Grow Faster</div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Publish more courses to reach more learners this month.
            </p>
            <Link
              href="/admin/courses/new"
              className="mt-3 block w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground"
            >
              Create Course
            </Link>
          </div>

          <div className="flex items-center gap-3 border-t border-border px-4 py-4">
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-maroon to-gold text-sm font-bold text-white">
              {data?.instructor.avatarUrl ? (
                <img src={data.instructor.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(data?.instructor.name || "IN")
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">{data?.instructor.name || "Instructor"}</div>
              <div className="text-[11px] text-primary">{data?.instructor.title || "Instructor"}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-4 border-b border-border bg-card/40 px-6 py-4 backdrop-blur">
            <div className="flex-1">
              <div className="text-xl font-extrabold text-ink">
                Welcome back, {data ? firstName(data.instructor.name) : "Instructor"}!
              </div>
              <div className="text-sm text-muted-foreground">
                Live performance for your courses from the platform database.
              </div>
            </div>
            <div className="relative hidden min-w-[340px] flex-1 md:block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search courses, students..."
                className="h-11 w-full rounded-xl border border-border bg-background/70 pl-11 pr-16 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/courses/new"
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> New Course
              </Link>
              <NotificationBell buttonClassName="h-10 w-10 rounded-xl border border-border bg-background/40" />
              <NotificationBell
                mode="emails"
                buttonClassName="h-10 w-10 rounded-xl border border-border bg-background/40"
              />
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Loading instructor dashboard...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Could not load instructor dashboard.</p>
                    <p className="mt-1 text-xs">{error}</p>
                  </div>
                </div>
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                  {kpis.map((k) => (
                    <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
                      <div
                        className={`mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${k.tint}`}
                      >
                        <k.icon className={`h-5 w-5 ${k.ring}`} />
                      </div>
                      <div className="text-xs text-muted-foreground">{k.label}</div>
                      <div className="mt-1 text-2xl font-extrabold text-ink">{k.value}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-primary">{k.delta}</span>
                        <TrendingUp className={`h-3.5 w-3.5 ${k.ring}`} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-ink">Revenue Overview</h3>
                          <div className="text-xs text-muted-foreground">
                            Earnings by month from completed payments
                          </div>
                        </div>
                      </div>
                      <BarChart data={data.revenueByMonth} />
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-bold text-ink">My Courses</h3>
                        <Link href="/admin/courses" className="text-xs font-semibold text-primary">
                          View All →
                        </Link>
                      </div>
                      {data.myCourses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No courses yet.{" "}
                          <Link href="/admin/courses/new" className="font-semibold text-primary">
                            Create your first course
                          </Link>
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px] text-left text-sm">
                            <thead className="text-xs text-muted-foreground">
                              <tr className="border-b border-border">
                                <th className="pb-3 font-semibold">Course</th>
                                <th className="pb-3 font-semibold">Students</th>
                                <th className="pb-3 font-semibold">Rating</th>
                                <th className="pb-3 font-semibold">Earnings</th>
                                <th className="pb-3 font-semibold">Status</th>
                                <th className="pb-3" />
                              </tr>
                            </thead>
                            <tbody>
                              {data.myCourses.map((course, index) => (
                                <tr key={course.id} className="border-b border-border/50 last:border-0">
                                  <td className="py-3">
                                    <div className="flex items-center gap-3">
                                      {course.thumbnailUrl ? (
                                        <img
                                          src={course.thumbnailUrl}
                                          alt=""
                                          className="h-10 w-14 shrink-0 rounded-md object-cover"
                                        />
                                      ) : (
                                        <div
                                          className={`h-10 w-14 shrink-0 rounded-md bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]}`}
                                        />
                                      )}
                                      <div className="font-semibold text-ink">{course.title}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 text-foreground/80">
                                    {course.students.toLocaleString("en-IN")}
                                  </td>
                                  <td className="py-3">
                                    <span className="inline-flex items-center gap-1 text-amber-400">
                                      <Star className="h-3 w-3 fill-current" /> {course.rating.toFixed(1)}
                                    </span>
                                  </td>
                                  <td className="py-3 font-semibold text-ink">
                                    {formatINR(course.earnings)}
                                  </td>
                                  <td className="py-3">
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                        course.status === "Published"
                                          ? "bg-primary/15 text-primary"
                                          : "bg-amber-500/15 text-amber-400"
                                      }`}
                                    >
                                      {course.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <Link
                                      href={`/admin/courses/${course.id}/edit`}
                                      className="text-xs font-semibold text-primary"
                                    >
                                      Edit
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-bold text-ink">Recent Students</h3>
                        <Link href="/admin/users" className="text-xs font-semibold text-primary">
                          View All →
                        </Link>
                      </div>
                      {data.recentStudents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No enrollments yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {data.recentStudents.map((student) => (
                            <div
                              key={student.id}
                              className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
                            >
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-maroon to-gold text-xs font-bold text-white">
                                {initials(student.name)}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-ink">{student.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {student.courseTitle} · Joined {relativeJoined(student.enrolledAt)}
                                </div>
                              </div>
                              <div className="hidden w-40 md:block">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${student.progress}%` }}
                                  />
                                </div>
                                <div className="mt-1 text-right text-[10px] text-primary">
                                  {student.progress}%
                                </div>
                              </div>
                              <Link
                                href="/admin/users"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:text-primary"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-maroon/25 bg-gradient-to-br from-maroon via-forest to-maroon p-5 text-white">
                      <div className="text-xs font-bold uppercase tracking-widest text-gold">
                        Total Earnings
                      </div>
                      <div className="mt-2 text-3xl font-extrabold text-white">
                        {formatINR(data.kpis.totalEarnings)}
                      </div>
                      <div className="text-[11px] text-white/70">From completed course payments</div>
                      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-gold" style={{ width: "72%" }} />
                      </div>
                      <Link
                        href="/admin/payments"
                        className="mt-4 block w-full rounded-lg bg-gold py-2 text-center text-xs font-semibold text-white hover:opacity-90"
                      >
                        View Payments
                      </Link>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="mb-3 text-base font-bold text-ink">Course Rating</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-extrabold text-ink">
                            {data.kpis.avgRating.toFixed(1)}
                          </div>
                          <div className="mt-1 flex justify-center gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {data.kpis.reviews.toLocaleString("en-IN")} learners
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5 text-sm text-muted-foreground">
                          <p>{data.kpis.activeCourses} published courses</p>
                          <p>{data.myCourses.length} courses total</p>
                          <p>{data.recentStudents.length} recent students</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="mb-3 text-base font-bold text-ink">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { i: Plus, l: "New Course", href: "/admin/courses/new" },
                          { i: Video, l: "Go Live", href: "/admin/live-classes" },
                          { i: Award, l: "Certificates", href: "/admin/certificates" },
                          { i: BarChart3, l: "Payments", href: "/admin/payments" },
                        ].map((action) => (
                          <Link
                            key={action.l}
                            href={action.href}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 p-3 hover:border-primary hover:text-primary"
                          >
                            <action.i className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-ink">{action.l}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  badge,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: number;
  href?: string;
}) {
  const className = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
  }`;
  const content = (
    <>
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
    badge?: number;
    href?: string;
  }[];
}) {
  return (
    <div>
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: number[] }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const max = Math.max(...data, 1);

  return (
    <div className="flex h-52 items-end gap-3">
      {data.map((value, index) => (
        <div key={months[index]} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="relative w-full">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-maroon to-gold"
              style={{ height: `${Math.max(8, (value / max) * 160)}px` }}
              title={formatINR(value)}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{months[index]}</span>
        </div>
      ))}
    </div>
  );
}
