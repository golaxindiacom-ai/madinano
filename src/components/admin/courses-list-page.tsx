"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  Eye,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Video,
  X,
  ClipboardList,
  Award,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type { CategoryTreeNode } from "@/lib/admin/categories";
import { flattenCategoryTree, discountPercent } from "@/lib/admin/categories";
import type {
  CourseAdminDetail,
  CourseListItem,
  CourseStats,
  Instructor,
} from "@/lib/admin/types";
import {
  adminPageClass,
  adminKpiGridClass,
  adminFilterBarClass,
  adminFilterSelectClass,
  AdminPageHeader,
  AdminDesktopTable,
  AdminMobileList,
  AdminMobileCard,
  AdminMobileRow,
  AdminMobileActions,
  AdminLoadingState,
  AdminEmptyState,
  adminTabBarClass,
} from "@/components/admin/admin-layout";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

const MODE_OPTIONS = [
  { label: "All Modes", value: "all" },
  { label: "Recorded", value: "recorded" },
  { label: "Live", value: "live" },
  { label: "Hybrid", value: "hybrid" },
];

function statusBadge(status: CourseListItem["status"]) {
  const map = {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-gold/20 text-maroon",
    archived: "bg-slate-100 text-slate-600",
  };
  return map[status];
}

export function CoursesListPage() {
  const [items, setItems] = useState<CourseListItem[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("");
  const [detail, setDetail] = useState<CourseAdminDetail | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "curriculum" | "enrollments" | "quizzes">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (modeFilter !== "all") params.set("mode", modeFilter);
      if (instructorFilter) params.set("instructorId", instructorFilter);
      const q = params.toString() ? `?${params}` : "";

      const [list, st, inst, catData] = await Promise.all([
        adminFetch<CourseListItem[]>(`/api/admin/courses${q}`),
        adminFetch<CourseStats>("/api/admin/courses?stats=true"),
        adminFetch<Instructor[]>("/api/admin/instructors?status=active"),
        adminFetch<{ tree: CategoryTreeNode[] }>("/api/admin/categories/tree"),
      ]);
      setItems(list);
      setStats(st);
      setInstructors(inst);
      const flat = flattenCategoryTree(catData.tree);
      setCategoryMap(new Map(flat.map((c) => [c.id, c.breadcrumb])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, modeFilter, instructorFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row: CourseListItem) => {
    try {
      const data = await adminFetch<CourseAdminDetail>(`/api/admin/courses/${row.id}`);
      setDetail(data);
      setDetailTab("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const setStatus = async (id: string, status: CourseListItem["status"]) => {
    try {
      await adminFetch(`/api/admin/courses/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
      if (detail?.course.id === id) openDetail({ ...detail.course, status } as CourseListItem);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  };

  const remove = async (row: CourseListItem) => {
    if (!confirm(`Delete "${row.title}" and all lessons, quizzes & enrollments?`)) return;
    try {
      await adminFetch(`/api/admin/courses/${row.id}`, { method: "DELETE" });
      if (detail?.course.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Title", "Instructor", "Mode", "Status", "Lessons", "Enrollments", "MRP", "Selling"];
    const rows = items.map((c) =>
      [c.title, c.instructorName, c.mode, c.status, c.lessonCount, c.activeEnrollments, c.originalPrice, c.sellingPrice].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "courses-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = useMemo(
    () => [
      { label: "Total Courses", value: stats?.total ?? 0, icon: BookOpen },
      { label: "Published", value: stats?.published ?? 0, icon: Eye },
      { label: "Drafts", value: stats?.draft ?? 0, icon: Pencil },
      { label: "Enrollments", value: stats?.totalEnrollments ?? 0, icon: Users },
    ],
    [stats],
  );

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Course Management"
        description="Create courses with curriculum, lessons, quizzes & live classes"
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export
            </button>
            <Link href="/admin/courses/new" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:flex-none">
              <Plus className="h-4 w-4" /> Create Course
            </Link>
          </>
        }
      />

      <div className={adminKpiGridClass}>
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <k.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-ink">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <strong>Flow:</strong>{" "}
        <Link href="/admin/instructors" className="font-semibold text-primary underline">Add Instructor</Link>
        {" → "}
        <Link href="/admin/quizzes/new" className="font-semibold text-primary underline">Create Quizzes</Link>
        {" → "}
        <strong>Create Course</strong> (curriculum + select quizzes + final exam)
        {" → "}
        <strong>Publish</strong> → students enroll at <Link href="/courses" className="font-semibold text-primary underline">/courses</Link>
      </div>

      <div className={cn("rounded-2xl border border-border bg-card p-4", adminFilterBarClass)}>
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className={adminFilterSelectClass}>
          {MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)} className={adminFilterSelectClass}>
          <option value="">All Instructors</option>
          {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <AdminDesktopTable>
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Content</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-muted-foreground">No courses yet</p>
                  <Link href="/admin/courses/new" className="mt-2 inline-block text-sm font-semibold text-primary">Create Course →</Link>
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{row.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{row.mode} · {row.level} · {row.duration}</p>
                    <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-muted-foreground">{categoryMap.get(row.categoryId) ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.instructorName}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <span>{row.sectionCount} sections</span>
                    <span className="mx-1">·</span>
                    <span>{row.lessonCount} lessons</span>
                    {row.liveClassCount > 0 && <><span className="mx-1">·</span><span>{row.liveClassCount} live</span></>}
                    {row.hasFinalExam && <span className="ml-1 text-primary">+ Exam</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-through text-xs text-muted-foreground">₹{row.originalPrice}</p>
                    <p className="font-semibold text-primary">₹{row.sellingPrice}</p>
                    {row.originalPrice > row.sellingPrice && (
                      <span className="text-[10px] font-bold text-forest">{discountPercent(row.originalPrice, row.sellingPrice)}% off</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{row.activeEnrollments}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusBadge(row.status))}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => openDetail(row)} className="grid h-8 w-8 place-items-center rounded-md border" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      <Link href={`/admin/courses/${row.id}/edit`} className="grid h-8 w-8 place-items-center rounded-md border" title="Edit"><Pencil className="h-3.5 w-3.5" /></Link>
                      {row.status !== "published" && (
                        <button type="button" onClick={() => setStatus(row.id, "published")} className="rounded-md border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700">Publish</button>
                      )}
                      {row.status === "published" && (
                        <Link href={`/courses/${row.id}/learn`} target="_blank" className="rounded-md border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary">Preview</Link>
                      )}
                      <button type="button" onClick={() => remove(row)} className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
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
        ) : items.length === 0 ? (
          <AdminEmptyState message="No courses yet" />
        ) : (
          items.map((row) => (
            <AdminMobileCard key={row.id}>
              <div>
                <p className="font-semibold text-ink">{row.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{row.mode} · {row.level} · {row.duration}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusBadge(row.status))}>{row.status}</span>
                </div>
              </div>
              <AdminMobileRow label="Instructor">{row.instructorName}</AdminMobileRow>
              <AdminMobileRow label="Category">{categoryMap.get(row.categoryId) ?? "—"}</AdminMobileRow>
              <AdminMobileRow label="Content">
                {row.sectionCount} sections · {row.lessonCount} lessons
                {row.liveClassCount > 0 ? ` · ${row.liveClassCount} live` : ""}
                {row.hasFinalExam ? " · Exam" : ""}
              </AdminMobileRow>
              <AdminMobileRow label="Price">
                <span className="font-semibold text-primary">₹{row.sellingPrice}</span>
                {row.originalPrice > row.sellingPrice && (
                  <span className="ml-1 text-[10px] text-forest">{discountPercent(row.originalPrice, row.sellingPrice)}% off</span>
                )}
              </AdminMobileRow>
              <AdminMobileRow label="Enrolled">{row.activeEnrollments}</AdminMobileRow>
              <AdminMobileActions>
                <button type="button" onClick={() => openDetail(row)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <Link href={`/admin/courses/${row.id}/edit`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                {row.status !== "published" && (
                  <button type="button" onClick={() => setStatus(row.id, "published")} className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Publish
                  </button>
                )}
                <button type="button" onClick={() => remove(row)} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AdminMobileActions>
            </AdminMobileCard>
          ))
        )}
      </AdminMobileList>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setDetail(null)}>
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-bold text-ink">{detail.course.title}</h2>
                <p className="text-sm text-muted-foreground">{detail.instructorName}</p>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusBadge(detail.course.status))}>{detail.course.status}</span>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="grid h-8 w-8 place-items-center rounded-lg border"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-border px-4">
              {(["overview", "curriculum", "enrollments", "quizzes"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setDetailTab(tab)} className={cn("shrink-0 px-3 py-2.5 text-xs font-semibold capitalize", detailTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailTab === "overview" && (
                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground">{detail.course.shortDescription || detail.course.description.slice(0, 200)}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border p-3 text-center"><Layers className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 font-bold">{detail.course.curriculum.length}</p><p className="text-[10px] text-muted-foreground">Sections</p></div>
                    <div className="rounded-lg border p-3 text-center"><BookOpen className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 font-bold">{detail.lessons.length}</p><p className="text-[10px] text-muted-foreground">Lessons</p></div>
                    <div className="rounded-lg border p-3 text-center"><Video className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 font-bold">{detail.liveClasses.length}</p><p className="text-[10px] text-muted-foreground">Live</p></div>
                    <div className="rounded-lg border p-3 text-center"><Users className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 font-bold">{detail.activeEnrollments}</p><p className="text-[10px] text-muted-foreground">Students</p></div>
                  </div>
                  <dl className="space-y-2">
                    <div><dt className="text-muted-foreground">Mode</dt><dd className="font-semibold capitalize">{detail.course.mode}</dd></div>
                    <div><dt className="text-muted-foreground">Level</dt><dd className="font-semibold capitalize">{detail.course.level}</dd></div>
                    <div><dt className="text-muted-foreground">Duration</dt><dd className="font-semibold">{detail.course.duration}</dd></div>
                    <div><dt className="text-muted-foreground">Price</dt><dd className="font-semibold">₹{detail.course.sellingPrice} <span className="text-xs text-muted-foreground line-through">₹{detail.course.originalPrice}</span></dd></div>
                    <div><dt className="text-muted-foreground">Final Exam</dt><dd className="font-semibold">{detail.finalExam ? detail.finalExam.title : "Not configured"}</dd></div>
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href={`/admin/courses/${detail.course.id}/edit`} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Edit Course</Link>
                    {detail.course.status !== "published" && (
                      <button type="button" onClick={() => setStatus(detail.course.id, "published")} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">Publish</button>
                    )}
                    {detail.course.status === "published" && (
                      <Link href={`/courses/${detail.course.id}/learn`} target="_blank" className="rounded-lg border px-3 py-2 text-xs font-semibold text-primary">Student Preview</Link>
                    )}
                  </div>
                </div>
              )}

              {detailTab === "curriculum" && (
                <div className="space-y-4">
                  {detail.course.curriculum.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sections yet.</p>
                  ) : (
                    detail.course.curriculum.map((sec) => {
                      const secLessons = detail.lessons.filter((l) => l.sectionId === sec.id);
                      return (
                        <div key={sec.id} className="rounded-xl border border-border p-3">
                          <p className="font-semibold text-ink">{sec.title}</p>
                          <p className="text-xs text-muted-foreground">{secLessons.length} lessons</p>
                          <ul className="mt-2 space-y-1">
                            {secLessons.map((l) => (
                              <li key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded bg-muted px-1.5 py-0.5 capitalize">{l.lessonType}</span>
                                {l.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {detailTab === "enrollments" && (
                detail.enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students enrolled yet. Enroll from <Link href="/admin/users" className="font-semibold text-primary">Users</Link>.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.enrollments.map((e) => (
                      <div key={e.id} className="rounded-lg border border-border p-3 text-sm">
                        <p className="font-semibold">{e.courseTitle}</p>
                        <p className="text-xs text-muted-foreground">{e.progress}% · {e.status} · {formatDate(e.enrolledAt)}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {detailTab === "quizzes" && (
                <div className="space-y-3">
                  {detail.finalExam && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                      <p className="flex items-center gap-1 text-xs font-bold uppercase text-primary"><Award className="h-3.5 w-3.5" /> Final Exam</p>
                      <p className="mt-1 font-semibold">{detail.finalExam.title}</p>
                      <p className="text-xs text-muted-foreground">{detail.finalExam.questions} questions · {detail.finalExam.durationMinutes} min</p>
                    </div>
                  )}
                  {Object.values(detail.lessonQuizzes).map((q) => (
                    <div key={q.id} className="rounded-lg border border-border p-3">
                      <p className="flex items-center gap-1 font-semibold"><ClipboardList className="h-3.5 w-3.5 text-primary" /> {q.title}</p>
                      <p className="text-xs text-muted-foreground">Lesson quiz · {q.questions} questions</p>
                    </div>
                  ))}
                  {!detail.finalExam && Object.keys(detail.lessonQuizzes).length === 0 && (
                    <p className="text-sm text-muted-foreground">No quizzes linked. Add quiz lessons or final exam in course builder.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
