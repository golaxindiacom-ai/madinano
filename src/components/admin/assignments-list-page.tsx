"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type {
  Assignment,
  AssignmentDetailPayload,
  AssignmentInput,
  AssignmentListItem,
  AssignmentStats,
  CurriculumSection,
  GradeSubmissionInput,
} from "@/lib/admin/types";
import {
  cardClass,
  helperClass,
  inputClass,
  labelClass,
  selectClass,
  textareaClass,
} from "@/components/admin/course-form-styles";
import {
  adminPageClass,
  adminKpiGridClass,
  adminFilterBarClass,
  adminFilterSelectClass,
  adminPageActionsClass,
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

type CourseOption = {
  id: string;
  title: string;
  status: string;
  curriculum: CurriculumSection[];
  instructorId: string;
};

type LessonOption = { id: string; title: string; sectionId: string };

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

const EMPTY_FORM: AssignmentInput = {
  title: "",
  courseId: "",
  sectionId: "",
  lessonId: "",
  description: "",
  instructions: "",
  dueDate: "",
  maxMarks: 100,
  allowLateSubmission: false,
  status: "open",
};

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadge(status: Assignment["status"], isOverdue: boolean) {
  if (isOverdue) return "bg-red-100 text-red-700";
  return status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600";
}

function statusLabel(status: Assignment["status"], isOverdue: boolean) {
  if (isOverdue) return "Overdue";
  return status;
}

export function AssignmentsListPage() {
  const [items, setItems] = useState<AssignmentListItem[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [lessonOptions, setLessonOptions] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentListItem | null>(null);
  const [form, setForm] = useState<AssignmentInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<AssignmentDetailPayload | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState<GradeSubmissionInput>({ marks: 0, feedback: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      if (overdueOnly) params.set("overdue", "true");
      const q = params.toString() ? `?${params}` : "";

      const [list, st, courseList] = await Promise.all([
        adminFetch<AssignmentListItem[]>(`/api/admin/assignments${q}`),
        adminFetch<AssignmentStats>("/api/admin/assignments?stats=true"),
        adminFetch<CourseOption[]>("/api/admin/assignments?courses=true"),
      ]);
      setItems(list);
      setStats(st);
      setCourses(courseList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, courseFilter, overdueOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseId),
    [courses, form.courseId],
  );

  const sections = selectedCourse?.curriculum ?? [];

  useEffect(() => {
    if (!form.courseId) {
      setLessonOptions([]);
      return;
    }
    adminFetch<LessonOption[]>(`/api/admin/assignments?lessons=true&courseId=${form.courseId}`)
      .then(setLessonOptions)
      .catch(() => setLessonOptions([]));
  }, [form.courseId]);

  const openCreate = () => {
    const defaultCourse = courses.find((c) => c.id === courseFilter) ?? courses[0];
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      courseId: defaultCourse?.id || "",
      sectionId: defaultCourse?.curriculum[0]?.id || "",
      dueDate: toDatetimeLocal(new Date(Date.now() + 7 * 86400000).toISOString()),
    });
    setModalOpen(true);
  };

  const openEdit = (row: AssignmentListItem) => {
    setEditing(row);
    setForm({
      title: row.title,
      courseId: row.courseId,
      sectionId: row.sectionId ?? "",
      lessonId: row.lessonId ?? "",
      description: row.description ?? "",
      instructions: row.instructions ?? "",
      dueDate: toDatetimeLocal(row.dueDate),
      maxMarks: row.maxMarks ?? 100,
      allowLateSubmission: row.allowLateSubmission ?? false,
      status: row.status,
    });
    setModalOpen(true);
  };

  const openDetail = async (row: AssignmentListItem) => {
    try {
      const data = await adminFetch<AssignmentDetailPayload>(`/api/admin/assignments/${row.id}`);
      setDetail(data);
      setGradingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: AssignmentInput = {
        ...form,
        sectionId: form.sectionId || undefined,
        lessonId: form.lessonId || undefined,
      };

      if (editing) {
        await adminFetch(`/api/admin/assignments/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/api/admin/assignments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row: AssignmentListItem) => {
    const next = row.status === "open" ? "closed" : "open";
    try {
      await adminFetch(`/api/admin/assignments/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      load();
      if (detail?.assignment.id === row.id) openDetail(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  };

  const remove = async (row: AssignmentListItem) => {
    if (!confirm(`Delete assignment "${row.title}" and all submissions?`)) return;
    try {
      await adminFetch(`/api/admin/assignments/${row.id}`, { method: "DELETE" });
      if (detail?.assignment.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const submitGrade = async (submissionId: string) => {
    try {
      await adminFetch(`/api/admin/assignment-submissions/${submissionId}`, {
        method: "PATCH",
        body: JSON.stringify(gradeForm),
      });
      setGradingId(null);
      if (detail) openDetail({ ...detail.assignment, courseTitle: detail.courseTitle } as AssignmentListItem);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Title", "Course", "Due Date", "Submissions", "Pending", "Max Marks", "Status"];
    const rows = items.map((a) =>
      [a.title, a.courseTitle, a.dueDate, a.submissions, a.pendingGrading, a.maxMarks ?? "", a.status].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assignments-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Assignments"
        description="Create assignments, set due dates, and grade student submissions"
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <button type="button" onClick={openCreate} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:flex-none">
              <Plus className="h-4 w-4" /> Add Assignment
            </button>
          </>
        }
      />

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">Recommended flow:</span>{" "}
        Add assignment-type lessons in{" "}
        <Link href="/admin/lessons" className="font-semibold text-primary underline">
          Lessons
        </Link>{" "}
        or{" "}
        <Link href="/admin/courses/new" className="font-semibold text-primary underline">
          Course Builder
        </Link>
        , then create graded assignments here and link them to lessons.
      </div>

      {stats && (
        <div className={adminKpiGridClass}>
          {[
            { label: "Total", value: stats.total, icon: ClipboardList },
            { label: "Open", value: stats.open, icon: LockOpen },
            { label: "Closed", value: stats.closed, icon: Lock },
            { label: "Overdue", value: stats.overdue, icon: AlertCircle },
            { label: "Submissions", value: stats.totalSubmissions, icon: Users },
            { label: "Pending Grade", value: stats.pendingGrading, icon: Clock },
            { label: "Courses", value: stats.coursesWithAssignments, icon: BookOpen },
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
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={adminFilterSelectClass}>
          <option value="">All Courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
          Overdue only
        </label>
      </div>

      {error && !modalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminDesktopTable>
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Assignment</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Submissions</th>
              <th className="px-4 py-3">Marks</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading assignments...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No assignments found</td></tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{row.title}</p>
                    {row.pendingGrading > 0 && (
                      <p className="text-xs text-amber-700">{row.pendingGrading} pending grade</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${row.courseId}/edit`} className="text-primary hover:underline">
                      {row.courseTitle}
                    </Link>
                    {row.sectionTitle && (
                      <p className="text-xs text-muted-foreground">{row.sectionTitle}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(row.dueDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.submissions}</td>
                  <td className="px-4 py-3">{row.maxMarks ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(row.status, row.isOverdue))}>
                      {statusLabel(row.status, row.isOverdue)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openDetail(row)} className="rounded-md border border-border p-1.5 hover:bg-background" title="View & grade">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => toggleStatus(row)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Open/close">
                        {row.status === "open" ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                      </button>
                      <button type="button" onClick={() => openEdit(row)} className="rounded-md border border-border p-1.5 hover:bg-background">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
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
          <AdminLoadingState message="Loading assignments..." />
        ) : items.length === 0 ? (
          <AdminEmptyState message="No assignments found" />
        ) : (
          items.map((row) => (
            <AdminMobileCard key={row.id}>
              <p className="font-semibold text-ink">{row.title}</p>
              {row.pendingGrading > 0 && <p className="text-xs text-amber-700">{row.pendingGrading} pending grade</p>}
              <div className="mt-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(row.status, row.isOverdue))}>
                  {statusLabel(row.status, row.isOverdue)}
                </span>
              </div>
              <AdminMobileRow label="Course">{row.courseTitle}</AdminMobileRow>
              <AdminMobileRow label="Due">{formatDate(row.dueDate)}</AdminMobileRow>
              <AdminMobileRow label="Submissions">{row.submissions}</AdminMobileRow>
              <AdminMobileRow label="Max Marks">{row.maxMarks ?? "—"}</AdminMobileRow>
              <AdminMobileActions>
                <button type="button" onClick={() => openDetail(row)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button type="button" onClick={() => openEdit(row)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
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
                <h2 className="text-lg font-bold text-ink">{detail.assignment.title}</h2>
                <p className="text-xs text-muted-foreground">{detail.courseTitle} · {detail.instructorName}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{formatDate(detail.assignment.dueDate)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Max Marks</p>
                  <p className="font-semibold">{detail.assignment.maxMarks ?? 100}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Submissions</p>
                  <p className="font-semibold">{detail.submissions.length}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{statusLabel(detail.assignment.status, detail.isOverdue)}</p>
                </div>
              </div>
              {detail.assignment.description && (
                <div>
                  <p className="text-sm font-semibold text-ink">Description</p>
                  <p className="mt-1 text-sm text-muted-foreground">{detail.assignment.description}</p>
                </div>
              )}
              {detail.assignment.instructions && (
                <div>
                  <p className="text-sm font-semibold text-ink">Instructions</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{detail.assignment.instructions}</p>
                </div>
              )}
              {detail.lessonTitle && (
                <p className="text-sm text-muted-foreground">
                  Linked lesson: <span className="font-semibold text-ink">{detail.lessonTitle}</span>
                </p>
              )}

              <div>
                <h3 className="text-sm font-semibold text-ink">Student Submissions</h3>
                {detail.submissions.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No submissions yet</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {detail.submissions.map((sub) => (
                      <li key={sub.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-ink">{sub.userName}</p>
                            <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Submitted {formatDate(sub.submittedAt)}</p>
                          </div>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            sub.status === "graded" ? "bg-emerald-100 text-emerald-700" :
                            sub.status === "returned" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700",
                          )}>
                            {sub.status}
                          </span>
                        </div>
                        {sub.content && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{sub.content}</p>
                        )}
                        {sub.status === "graded" && sub.marks != null && (
                          <p className="mt-2 text-sm font-semibold text-ink">
                            Score: {sub.marks}/{detail.assignment.maxMarks ?? 100}
                          </p>
                        )}
                        {sub.feedback && (
                          <p className="mt-1 text-sm text-muted-foreground">Feedback: {sub.feedback}</p>
                        )}
                        {gradingId === sub.id ? (
                          <div className="mt-3 space-y-2 border-t border-border pt-3">
                            <label className="block">
                              <span className={labelClass}>Marks (max {detail.assignment.maxMarks ?? 100})</span>
                              <input
                                type="number"
                                min={0}
                                max={detail.assignment.maxMarks ?? 100}
                                value={gradeForm.marks}
                                onChange={(e) => setGradeForm((f) => ({ ...f, marks: Number(e.target.value) }))}
                                className={inputClass}
                              />
                            </label>
                            <label className="block">
                              <span className={labelClass}>Feedback</span>
                              <textarea
                                value={gradeForm.feedback}
                                onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                                className={textareaClass + " min-h-[60px]"}
                              />
                            </label>
                            <div className={adminPageActionsClass}>
                              <button type="button" onClick={() => submitGrade(sub.id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                                Save Grade
                              </button>
                              <button type="button" onClick={() => setGradingId(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : sub.status === "submitted" && (
                          <button
                            type="button"
                            onClick={() => {
                              setGradingId(sub.id);
                              setGradeForm({ marks: 0, feedback: "" });
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Grade submission
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <button type="button" onClick={() => { const row = items.find((i) => i.id === detail.assignment.id); if (row) openEdit(row); }} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold">
                Edit
              </button>
              <Link href={`/admin/courses/${detail.assignment.courseId}/edit`} className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground">
                Open Course
              </Link>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSave} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">{editing ? "Edit Assignment" : "Add Assignment"}</h2>
            {error && modalOpen && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className={labelClass}>Course *</span>
                <select
                  value={form.courseId}
                  onChange={(e) => {
                    const courseId = e.target.value;
                    const course = courses.find((c) => c.id === courseId);
                    setForm((f) => ({
                      ...f,
                      courseId,
                      sectionId: course?.curriculum[0]?.id ?? "",
                      lessonId: "",
                    }));
                  }}
                  className={selectClass}
                  required
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Section</span>
                <select
                  value={form.sectionId}
                  onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                  className={selectClass}
                  disabled={!form.courseId || sections.length === 0}
                >
                  <option value="">Optional — select section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Link to Lesson (optional)</span>
                <select
                  value={form.lessonId}
                  onChange={(e) => setForm((f) => ({ ...f, lessonId: e.target.value }))}
                  className={selectClass}
                  disabled={!form.courseId || lessonOptions.length === 0}
                >
                  <option value="">
                    {!form.courseId ? "Select course first" : lessonOptions.length === 0 ? "No assignment lessons — add in Lessons page" : "None"}
                  </option>
                  {lessonOptions.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                {form.courseId && lessonOptions.length === 0 && (
                  <p className={helperClass}>
                    <Link href="/admin/lessons" className="text-primary underline">Create assignment-type lessons</Link>
                  </p>
                )}
              </label>
              <label className="block">
                <span className={labelClass}>Title *</span>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} required />
              </label>
              <label className="block">
                <span className={labelClass}>Due Date *</span>
                <input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inputClass}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Max Marks</span>
                  <input type="number" min={1} value={form.maxMarks} onChange={(e) => setForm((f) => ({ ...f, maxMarks: Number(e.target.value) }))} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Status</span>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Assignment["status"] }))} className={selectClass}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.allowLateSubmission} onChange={(e) => setForm((f) => ({ ...f, allowLateSubmission: e.target.checked }))} />
                Allow late submissions after due date
              </label>
              <label className="block">
                <span className={labelClass}>Description</span>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={textareaClass + " min-h-[60px]"} />
              </label>
              <label className="block">
                <span className={labelClass}>Instructions for Students</span>
                <textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className={textareaClass + " min-h-[100px]"} placeholder="What should students submit? Format, links, files..." />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setModalOpen(false); setError(""); }} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
