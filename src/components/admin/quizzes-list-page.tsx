"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type { Quiz, QuizAdminDetail, QuizKind, QuizListItem, QuizStats } from "@/lib/admin/types";
import { cardClass, inputClass, selectClass } from "@/components/admin/course-form-styles";
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
} from "@/components/admin/admin-layout";
import { cn } from "@/lib/utils";

type CourseOption = { id: string; title: string; instructorId: string };
type InstructorOption = { id: string; name: string };

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Inactive", value: "inactive" },
];

const KIND_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Library (unassigned)", value: "library" },
  { label: "Lesson Quiz", value: "lesson_quiz" },
  { label: "Final Exam", value: "final_exam" },
];

function kindLabel(kind?: QuizKind) {
  if (kind === "lesson_quiz") return "Lesson Quiz";
  if (kind === "final_exam") return "Final Exam";
  return "Library";
}

function kindBadge(kind?: QuizKind) {
  if (kind === "lesson_quiz") return "bg-purple-100 text-purple-700";
  if (kind === "final_exam") return "bg-maroon/15 text-maroon";
  return "bg-slate-100 text-slate-600";
}

function statusBadge(status: Quiz["status"]) {
  const map = {
    active: "bg-emerald-100 text-emerald-700",
    draft: "bg-gold/20 text-maroon",
    inactive: "bg-slate-100 text-slate-600",
  };
  return map[status];
}

export function QuizzesListPage({
  basePath = "/admin/quizzes",
  instructorId: fixedInstructorId,
}: {
  basePath?: string;
  instructorId?: string;
} = {}) {
  const [items, setItems] = useState<QuizListItem[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [instructorFilter, setInstructorFilter] = useState(fixedInstructorId ?? "");
  const [detail, setDetail] = useState<QuizAdminDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (kindFilter !== "all") params.set("kind", kindFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      if (instructorFilter) params.set("instructorId", instructorFilter);
      const q = params.toString() ? `?${params}` : "";

      const [list, st, courseList, instList] = await Promise.all([
        adminFetch<QuizListItem[]>(`/api/admin/quizzes${q}`),
        adminFetch<QuizStats>("/api/admin/quizzes?stats=true"),
        adminFetch<CourseOption[]>("/api/admin/quizzes?courses=true"),
        fixedInstructorId
          ? Promise.resolve([])
          : adminFetch<InstructorOption[]>("/api/admin/quizzes?instructors=true"),
      ]);
      setItems(list);
      setStats(st);
      setCourses(courseList);
      setInstructors(instList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, kindFilter, courseFilter, instructorFilter, fixedInstructorId]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row: QuizListItem) => {
    try {
      const data = await adminFetch<QuizAdminDetail>(`/api/admin/quizzes/${row.id}`);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const toggleStatus = async (row: QuizListItem) => {
    const next = row.status === "active" ? "draft" : "active";
    try {
      await adminFetch(`/api/admin/quizzes/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      load();
      if (detail?.quiz.id === row.id) openDetail(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  };

  const remove = async (row: QuizListItem, force = false) => {
    const msg = force
      ? `Force delete "${row.title}"? This will unlink from courses/lessons.`
      : `Delete quiz "${row.title}"?`;
    if (!confirm(msg)) return;
    try {
      const q = force ? "?force=true" : "";
      await adminFetch(`/api/admin/quizzes/${row.id}${q}`, { method: "DELETE" });
      if (detail?.quiz.id === row.id) setDetail(null);
      load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      if (!force && message.includes("linked")) {
        if (confirm(`${message}\n\nForce delete anyway?`)) remove(row, true);
      } else {
        setError(message);
      }
    }
  };

  const exportCsv = () => {
    const headers = ["Title", "Type", "Course", "Questions", "Duration", "Pass %", "Attempts", "Status"];
    const rows = items.map((q) =>
      [q.title, kindLabel(q.quizKind), q.courseTitle ?? "Library", q.questions, q.durationMinutes, q.passingPercentage, q.attemptCount, q.status].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quizzes-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Quiz Library"
        description="Create quizzes & exams, then attach to course lessons or final exam"
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <Link href={`${basePath}/new`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:flex-none">
              <Plus className="h-4 w-4" /> Create Quiz
            </Link>
          </>
        }
      />

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">Recommended flow:</span>{" "}
        1) Create quiz here → 2) Open{" "}
        <Link href="/admin/courses" className="font-semibold text-primary underline">
          Course Builder
        </Link>{" "}
        → 3) Select from library for lesson quiz or final exam.
      </div>

      {stats && (
        <div className={adminKpiGridClass}>
          {[
            { label: "Total", value: stats.total, icon: ClipboardList },
            { label: "Active", value: stats.active, icon: Eye },
            { label: "Draft", value: stats.draft, icon: EyeOff },
            { label: "Lesson Quiz", value: stats.lessonQuizzes, icon: HelpCircle },
            { label: "Final Exam", value: stats.finalExams, icon: Award },
            { label: "Library", value: stats.library, icon: BookOpen },
            { label: "Attempts", value: stats.totalAttempts, icon: Users },
            { label: "Inactive", value: stats.inactive, icon: EyeOff },
          ].map((item) => (
            <div key={item.label} className={cn(cardClass, "flex items-center gap-3 p-3")}>
              <item.icon className="h-6 w-6 shrink-0 text-primary/70" />
              <div>
                <p className="text-xl font-bold text-ink">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={cn("rounded-2xl border border-border bg-card p-4", adminFilterBarClass)}>
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, course, instructor..." className={cn(inputClass, "pl-9")} />
        </div>
        {!fixedInstructorId && (
          <select value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)} className={adminFilterSelectClass}>
            <option value="">All Instructors</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        )}
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={adminFilterSelectClass}>
          <option value="">All Courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className={adminFilterSelectClass}>
          {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminDesktopTable>
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Quiz</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Course / Link</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Pass %</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading quizzes...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-muted-foreground">No quizzes yet</p>
                  <Link href={`${basePath}/new`} className="mt-2 inline-block text-sm font-semibold text-primary">Create quiz</Link>
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{row.title}</p>
                    {row.instructorName && (
                      <p className="text-xs text-muted-foreground">{row.instructorName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", kindBadge(row.quizKind))}>
                      {kindLabel(row.quizKind)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.courseId ? (
                      <Link href={`/admin/courses/${row.courseId}/edit`} className="text-primary hover:underline">
                        {row.courseTitle ?? "Course"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Library</span>
                    )}
                    {row.isLinked && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" /> Linked
                        {row.lessonTitle ? ` · ${row.lessonTitle}` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{row.questions}</td>
                  <td className="px-4 py-3">{row.durationMinutes} min</td>
                  <td className="px-4 py-3">{row.passingPercentage}%</td>
                  <td className="px-4 py-3">{row.attemptCount}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(row.status))}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openDetail(row)} className="rounded-md border border-border p-1.5 hover:bg-background" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <Link href={`/exams/${row.id}`} target="_blank" className="rounded-md border border-border p-1.5 hover:bg-background" title="Preview">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </Link>
                      <button type="button" onClick={() => toggleStatus(row)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Toggle active">
                        {row.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <Link href={`${basePath}/${row.id}/edit`} className="rounded-md border border-border p-1.5 hover:bg-background">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button type="button" onClick={() => remove(row)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
          <AdminLoadingState message="Loading quizzes..." />
        ) : items.length === 0 ? (
          <AdminEmptyState message="No quizzes yet" />
        ) : (
          items.map((row) => (
            <AdminMobileCard key={row.id}>
              <p className="font-semibold text-ink">{row.title}</p>
              {row.instructorName && <p className="text-xs text-muted-foreground">{row.instructorName}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", kindBadge(row.quizKind))}>{kindLabel(row.quizKind)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(row.status))}>{row.status}</span>
              </div>
              <AdminMobileRow label="Course">{row.courseTitle ?? "Library"}</AdminMobileRow>
              <AdminMobileRow label="Questions">{row.questions}</AdminMobileRow>
              <AdminMobileRow label="Duration">{row.durationMinutes} min</AdminMobileRow>
              <AdminMobileRow label="Attempts">{row.attemptCount}</AdminMobileRow>
              <AdminMobileActions>
                <button type="button" onClick={() => openDetail(row)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <Link href={`${basePath}/${row.id}/edit`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button type="button" onClick={() => remove(row)} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AdminMobileActions>
            </AdminMobileCard>
          ))
        )}
      </AdminMobileList>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-lg flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{detail.quiz.title}</h2>
                <p className="text-xs text-muted-foreground">{kindLabel(detail.quiz.quizKind)} · {detail.quiz.questions} questions</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">{detail.quiz.durationMinutes} min</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Passing</p>
                  <p className="font-semibold">{detail.quiz.passingPercentage}% ({detail.quiz.passingMarks}/{detail.quiz.totalMarks})</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Max Attempts</p>
                  <p className="font-semibold">{detail.quiz.maxAttempts}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Attempts</p>
                  <p className="font-semibold">{detail.attempts.length}</p>
                </div>
              </div>
              {detail.quiz.description && (
                <p className="text-sm text-muted-foreground">{detail.quiz.description}</p>
              )}
              {detail.links.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-ink">Linked to</p>
                  <ul className="mt-2 space-y-1">
                    {detail.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link href={link.href} className="text-sm text-primary hover:underline">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-ink">Settings</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Shuffle questions: {detail.quiz.shuffleQuestions ? "Yes" : "No"}</li>
                  <li>Shuffle options: {detail.quiz.shuffleOptions ? "Yes" : "No"}</li>
                  <li>Proctoring: {detail.quiz.enableProctoring ? "On" : "Off"}</li>
                  <li>Certificate on pass: {detail.quiz.issueCertificateOnPass ? "Yes" : "No"}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Recent Attempts</h3>
                {detail.attempts.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No attempts yet</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {detail.attempts.slice(0, 8).map((a) => (
                      <li key={a.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                        <p className="font-semibold text-ink">{a.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.percentage}% · {a.passed ? "Passed" : "Failed"} · {formatDate(a.startedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {detail.attempts.length > 0 && (
                  <Link href="/admin/exam-attempts" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                    View all attempts →
                  </Link>
                )}
              </div>
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <Link href={`${basePath}/${detail.quiz.id}/edit`} className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-semibold">
                Edit Quiz
              </Link>
              <Link href={`/exams/${detail.quiz.id}`} target="_blank" className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground">
                Preview Exam
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
