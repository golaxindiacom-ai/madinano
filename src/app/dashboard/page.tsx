"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardCertificatesPanel } from "@/components/dashboard/dashboard-certificates-panel";
import { getStudentSession, syncSessionFromServer } from "@/lib/exam/student-session";
import { images } from "@/lib/images";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Crown,
  ExternalLink,
  FileText,
  GraduationCap,
  Home,
  Play,
  Radio,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Trophy,
  User,
  Video,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

type DashboardData = {
  student: { id: string; name: string; email: string };
  kpis: {
    enrolledCourses: number;
    completedCourses: number;
    certificates: number;
    averageProgress: number;
  };
  myCourses: {
    id: string;
    courseId: string;
    title: string;
    progress: number;
    status: string;
    thumbnailUrl?: string | null;
    duration?: string | null;
  }[];
  assignments: {
    id: string;
    title: string;
    courseTitle: string;
    dueDate: string;
    status: string;
  }[];
  upcomingLive?: {
    id: string;
    title: string;
    instructorName: string;
    scheduledAt: string;
    duration: string;
    status: string;
    joinUrl?: string | null;
    enrolled: number;
  } | null;
  certificates: number;
};

const sidebar = {
  primary: [
    { icon: Home, label: "Dashboard", href: "/dashboard", active: true },
    { icon: Video, label: "Live Classes", href: "/live-classes", active: false },
    { icon: ClipboardList, label: "Exams", href: "/exams", active: false },
    { icon: User, label: "Account", href: "/dashboard/account", active: false },
  ],
  billing: [
    { icon: Receipt, label: "Payment History", href: "/dashboard/payments", active: false },
    { icon: ShoppingCart, label: "My Orders", href: "/dashboard/orders", active: false },
    { icon: Crown, label: "My Subscription", href: "/dashboard/subscription", active: false },
    { icon: BookOpen, label: "Pricing", href: "/pricing", active: false },
  ],
};

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

function formatDueDate(iso: string) {
  const dueDate = new Date(iso);
  const diff = dueDate.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (Number.isNaN(dueDate.getTime())) return "Due date unavailable";
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Schedule unavailable";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return { text: "Completed", className: "bg-emerald-100 text-emerald-700" };
    case "active":
    case "in_progress":
      return { text: "In Progress", className: "bg-primary text-primary-foreground" };
    default:
      return { text: status.replace(/_/g, " "), className: "bg-gold text-white" };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const session = await syncSessionFromServer();
    if (!session) {
      router.replace("/login?next=/dashboard");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/mine?userId=${encodeURIComponent(session.id)}`, {
        cache: "no-store",
      });
      const json = await response.json();

      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "Unable to load your dashboard.");
      }

      setData((json?.data ?? json) as DashboardData);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const student = data?.student ?? null;
  const continueCourse = useMemo(
    () => data?.myCourses.find((course) => course.progress < 100) ?? data?.myCourses[0] ?? null,
    [data?.myCourses],
  );

  const kpis = useMemo(
    () =>
      data
        ? [
            {
              icon: GraduationCap,
              label: "Enrolled Courses",
              value: String(data.kpis.enrolledCourses),
              tint: "from-maroon/15 to-maroon/5",
              ring: "text-maroon",
            },
            {
              icon: CheckCircle2,
              label: "Completed Courses",
              value: String(data.kpis.completedCourses).padStart(2, "0"),
              tint: "from-gold/20 to-gold/5",
              ring: "text-gold",
            },
            {
              icon: Award,
              label: "Certificates Earned",
              value: String(data.kpis.certificates).padStart(2, "0"),
              tint: "from-maroon/15 to-maroon/5",
              ring: "text-maroon",
            },
            {
              icon: TrendingUp,
              label: "Average Progress",
              value: `${data.kpis.averageProgress}%`,
              tint: "from-gold/20 to-gold/5",
              ring: "text-gold",
            },
          ]
        : [],
    [data],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur lg:flex">
          <Link href="/" className="flex items-center gap-2.5 border-b border-border px-6 py-5">
            <img
              src={images.logo}
              alt="Navbharat Gurukulam"
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-ink">
                Navbharat <span className="text-primary">Gurukulam</span>
              </span>
              <span className="block text-[10px] font-medium text-muted-foreground">
                Learn | Grow | Succeed
              </span>
            </span>
          </Link>

          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5 text-sm">
            <NavGroup title="Student" items={sidebar.primary} />
            <NavGroup title="Billing" items={sidebar.billing} />
          </nav>

          <div className="mx-4 mb-4 rounded-2xl border border-maroon/20 bg-gradient-to-br from-maroon/15 to-gold/10 p-4 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-maroon/10">
              <Trophy className="h-6 w-6 text-gold" />
            </div>
            <div className="text-sm font-bold text-ink">Upgrade to Premium</div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Unlock unlimited courses, certificates and live classes.
            </p>
            <Link
              href="/pricing"
              className="mt-3 block w-full rounded-lg bg-maroon py-2 text-center text-xs font-semibold text-white hover:opacity-90"
            >
              Go Premium
            </Link>
          </div>

          <Link href="/dashboard/account" className="flex items-center gap-3 border-t border-border px-4 py-4 hover:bg-muted/40">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-maroon to-gold text-sm font-bold text-white">
              {student ? initials(student.name) : "NG"}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">{student?.name ?? "Loading student"}</div>
              <div className="text-[11px] text-muted-foreground">Account & password</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-border bg-card/40 px-6 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <div className="text-xl font-extrabold text-ink">
                  {student ? `Welcome back, ${firstName(student.name)}` : "Welcome back"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Track your courses, assignments, live learning, and certificates in one place.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell buttonClassName="h-10 w-10 rounded-xl border border-border bg-background/50" />
                <div className="rounded-xl border border-border bg-background/50 px-4 py-2 text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Signed in as
                  </div>
                  <div className="text-sm font-semibold text-ink">{student?.email ?? "Loading..."}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
              {[...sidebar.primary, ...sidebar.billing].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    item.active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground/80"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Loading dashboard...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Could not load your dashboard.</p>
                    <p className="mt-1 text-xs">{error}</p>
                    <button
                      type="button"
                      onClick={() => void loadDashboard()}
                      className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {kpis.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
                      <div
                        className={`mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${item.tint}`}
                      >
                        <item.icon className={`h-5 w-5 ${item.ring}`} />
                      </div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="mt-1 text-2xl font-extrabold text-ink">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
                  <div className="space-y-6">
                    {continueCourse ? (
                      <section className="rounded-2xl border border-border bg-card p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-base font-bold text-ink">Continue Learning</h2>
                          <Link
                            href={`/courses/${continueCourse.courseId}/learn`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Go to course →
                          </Link>
                        </div>

                        <div className="grid gap-5 md:grid-cols-[280px_1fr]">
                          <div className="relative aspect-video overflow-hidden rounded-xl">
                            {continueCourse.thumbnailUrl ? (
                              <img
                                src={continueCourse.thumbnailUrl}
                                alt={continueCourse.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-maroon via-primary to-gold" />
                            )}
                            <Link
                              href={`/courses/${continueCourse.courseId}/learn`}
                              className="absolute inset-0 m-auto grid h-14 w-14 place-items-center rounded-full bg-white/90 text-maroon shadow-lg"
                              aria-label={`Continue ${continueCourse.title}`}
                            >
                              <Play className="h-6 w-6 fill-current" />
                            </Link>
                          </div>

                          <div>
                            <div className="text-lg font-bold text-ink">{continueCourse.title}</div>
                            <div className="mt-1 text-sm capitalize text-muted-foreground">
                              Status: {continueCourse.status.replace(/_/g, " ")}
                            </div>

                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{continueCourse.progress}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${continueCourse.progress}%` }}
                                />
                              </div>
                            </div>

                            {continueCourse.duration ? (
                              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {continueCourse.duration}
                              </div>
                            ) : null}

                            <Link
                              href={`/courses/${continueCourse.courseId}/learn`}
                              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                              Continue Learning
                            </Link>
                          </div>
                        </div>
                      </section>
                    ) : null}

                    <section id="my-courses" className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-ink">My Courses</h2>
                        <span className="text-xs text-muted-foreground">{data.myCourses.length} enrolled</span>
                      </div>

                      {data.myCourses.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
                          <p className="mt-2 text-sm text-muted-foreground">No courses enrolled yet.</p>
                          <Link href="/courses" className="mt-3 inline-block text-xs font-semibold text-primary">
                            Browse courses →
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {data.myCourses.map((course) => {
                            const badge = statusLabel(course.status);

                            return (
                              <Link
                                key={course.id}
                                href={`/courses/${course.courseId}/learn`}
                                className="overflow-hidden rounded-xl border border-border bg-background/40 transition hover:border-primary/50"
                              >
                                <div className="relative aspect-video overflow-hidden">
                                  {course.thumbnailUrl ? (
                                    <img
                                      src={course.thumbnailUrl}
                                      alt={course.title}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-maroon via-primary to-gold" />
                                  )}
                                  <span
                                    className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${badge.className}`}
                                  >
                                    {badge.text}
                                  </span>
                                </div>

                                <div className="p-3">
                                  <div className="line-clamp-2 min-h-[36px] text-sm font-semibold text-ink">
                                    {course.title}
                                  </div>
                                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-primary"
                                      style={{ width: `${course.progress}%` }}
                                    />
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{course.progress}% complete</span>
                                    {course.duration ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {course.duration}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    <div id="certificates">
                      <DashboardCertificatesPanel />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section id="upcoming-live" className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-bold text-ink">Upcoming Live Class</h2>
                      </div>

                      {data.upcomingLive ? (
                        <>
                          <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-maroon via-primary to-gold">
                            {data.upcomingLive.status === "live" ? (
                              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                <Radio className="h-3 w-3" />
                                LIVE
                              </span>
                            ) : null}
                            <div className="absolute inset-0 flex items-end p-4">
                              <div className="rounded-xl bg-black/25 px-3 py-2 text-white backdrop-blur">
                                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                                  Live Learning
                                </div>
                                <div className="mt-1 text-sm font-semibold">{data.upcomingLive.title}</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-sm font-bold text-ink">{data.upcomingLive.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            By {data.upcomingLive.instructorName}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            <span>{formatDateTime(data.upcomingLive.scheduledAt)}</span>
                            <span>{data.upcomingLive.duration}</span>
                            <span>{data.upcomingLive.enrolled} enrolled</span>
                          </div>

                          {data.upcomingLive.joinUrl ? (
                            <a
                              href={data.upcomingLive.joinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-2 text-center text-xs font-semibold text-primary-foreground"
                            >
                              Join Class
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="mt-3 w-full rounded-lg bg-primary/50 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Join Class
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                          <Video className="mx-auto h-8 w-8 text-muted-foreground/40" />
                          <p className="mt-2 text-sm text-muted-foreground">No upcoming live classes.</p>
                        </div>
                      )}
                    </section>

                    <section id="assignments" className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-bold text-ink">Assignments</h2>
                        <span className="text-xs text-muted-foreground">{data.assignments.length} open</span>
                      </div>

                      {data.assignments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                          <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                          <p className="mt-2 text-sm text-muted-foreground">No pending assignments.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {data.assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3"
                            >
                              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-ink">{assignment.title}</div>
                                <div className="text-[10px] text-muted-foreground">{assignment.courseTitle}</div>
                                <div className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {assignment.status.replace(/_/g, " ")}
                                </div>
                              </div>
                              <div className="text-right text-[10px] font-semibold text-amber-500">
                                {formatDueDate(assignment.dueDate)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
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
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    href: string;
    active?: boolean;
  }[];
}) {
  return (
    <div>
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}
