"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Video,
  X,
  Youtube,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import { QuizPicker } from "@/components/admin/quiz-picker";
import { youtubeThumbnail } from "@/lib/admin/youtube";
import type {
  CurriculumSection,
  Lesson,
  LessonDetailPayload,
  LessonInput,
  LessonListItem,
  LessonStats,
  LessonType,
} from "@/lib/admin/types";
import {
  cardClass,
  helperClass,
  inputClass,
  labelClass,
  selectClass,
  textareaClass,
} from "@/components/admin/course-form-styles";
import { cn } from "@/lib/utils";

type CourseOption = {
  id: string;
  title: string;
  status: string;
  curriculum: CurriculumSection[];
  instructorId: string;
};

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
];

const TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Video", value: "video" },
  { label: "Text", value: "text" },
  { label: "Quiz", value: "quiz" },
  { label: "Assignment", value: "assignment" },
];

const EMPTY_FORM: LessonInput = {
  title: "",
  courseId: "",
  sectionId: "",
  description: "",
  duration: "",
  order: 1,
  status: "draft",
  lessonType: "video",
  content: "",
  videoUrl: "",
  isPrivateVideo: false,
  quizId: "",
};

function typeIcon(type: LessonType) {
  const map = {
    video: Video,
    text: FileText,
    quiz: HelpCircle,
    assignment: ClipboardList,
  };
  return map[type];
}

function typeBadge(type: LessonType) {
  const map = {
    video: "bg-red-100 text-red-700",
    text: "bg-blue-100 text-blue-700",
    quiz: "bg-purple-100 text-purple-700",
    assignment: "bg-amber-100 text-amber-700",
  };
  return map[type];
}

function statusBadge(status: Lesson["status"]) {
  return status === "published"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-gold/20 text-maroon";
}

export function LessonsListPage() {
  const [items, setItems] = useState<LessonListItem[]>([]);
  const [stats, setStats] = useState<LessonStats | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LessonListItem | null>(null);
  const [form, setForm] = useState<LessonInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<LessonDetailPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      const q = params.toString() ? `?${params}` : "";

      const [list, st, courseList] = await Promise.all([
        adminFetch<LessonListItem[]>(`/api/admin/lessons${q}`),
        adminFetch<LessonStats>("/api/admin/lessons?stats=true"),
        adminFetch<CourseOption[]>("/api/admin/lessons?courses=true"),
      ]);
      setItems(list);
      setStats(st);
      setCourses(courseList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, courseFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseId),
    [courses, form.courseId],
  );

  const sections = selectedCourse?.curriculum ?? [];

  const openCreate = () => {
    const defaultCourse = courses.find((c) => c.id === courseFilter) ?? courses[0];
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      courseId: defaultCourse?.id || "",
      sectionId: defaultCourse?.curriculum[0]?.id || "",
    });
    setModalOpen(true);
  };

  const openEdit = (row: LessonListItem) => {
    setEditing(row);
    setForm({
      title: row.title,
      courseId: row.courseId,
      sectionId: row.sectionId,
      description: row.description ?? "",
      duration: row.duration,
      order: row.order,
      status: row.status,
      lessonType: row.lessonType,
      content: row.content ?? "",
      videoUrl: row.videoUrl ?? "",
      isPrivateVideo: row.isPrivateVideo ?? false,
      quizId: row.quizId ?? "",
    });
    setModalOpen(true);
  };

  const openDetail = async (row: LessonListItem) => {
    try {
      const data = await adminFetch<LessonDetailPayload>(`/api/admin/lessons/${row.id}`);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: LessonInput = {
        ...form,
        quizId: form.lessonType === "quiz" ? form.quizId : undefined,
        videoUrl: form.lessonType === "video" ? form.videoUrl : undefined,
        content: form.lessonType === "text" || form.lessonType === "assignment" ? form.content : undefined,
      };

      if (editing) {
        await adminFetch(`/api/admin/lessons/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/api/admin/lessons", {
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

  const toggleStatus = async (row: LessonListItem) => {
    const next = row.status === "published" ? "draft" : "published";
    try {
      await adminFetch(`/api/admin/lessons/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      load();
      if (detail?.lesson.id === row.id) openDetail(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  };

  const remove = async (row: LessonListItem) => {
    if (!confirm(`Delete lesson "${row.title}"?`)) return;
    try {
      await adminFetch(`/api/admin/lessons/${row.id}`, { method: "DELETE" });
      if (detail?.lesson.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Title", "Course", "Section", "Type", "Duration", "Order", "Status"];
    const rows = items.map((l) =>
      [l.title, l.courseTitle, l.sectionTitle, l.lessonType, l.duration, l.order, l.status].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lessons-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Lessons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage course lessons — video, text, quiz & assignment content
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Add Lesson
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">Recommended flow:</span>{" "}
        Build full curriculum in{" "}
        <Link href="/admin/courses/new" className="font-semibold text-primary underline">
          Course Builder
        </Link>
        . Use this page to overview, quick-edit, or publish individual lessons across all courses.
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            { label: "Total", value: stats.total, icon: FileText },
            { label: "Published", value: stats.published, icon: Eye },
            { label: "Draft", value: stats.draft, icon: EyeOff },
            { label: "Video", value: stats.video, icon: Video },
            { label: "Text", value: stats.text, icon: FileText },
            { label: "Quiz", value: stats.quiz, icon: HelpCircle },
            { label: "Assignment", value: stats.assignment, icon: ClipboardList },
            { label: "Courses", value: stats.coursesWithLessons, icon: BookOpen },
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, course, section..."
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectClass}>
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && !modalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className={cn(cardClass, "overflow-x-auto")}>
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Lesson</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading lessons...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No lessons found</td></tr>
            ) : (
              items.map((row) => {
                const Icon = typeIcon(row.lessonType);
                return (
                  <tr key={row.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-ink">{row.title}</p>
                          <p className="text-xs text-muted-foreground">Order {row.order}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/courses/${row.courseId}/edit`} className="text-primary hover:underline">
                        {row.courseTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.sectionTitle}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", typeBadge(row.lessonType))}>
                        {row.lessonType}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.duration}</td>
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
                        <button type="button" onClick={() => toggleStatus(row)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Toggle status">
                          {row.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-md flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{detail.lesson.title}</h2>
                <p className="text-xs text-muted-foreground">{detail.courseTitle} › {detail.sectionTitle}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {detail.lesson.lessonType === "video" && detail.lesson.videoId && (
                <img
                  src={youtubeThumbnail(detail.lesson.videoId)}
                  alt=""
                  className="w-full rounded-xl border border-border"
                />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{detail.lesson.lessonType}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">{detail.lesson.duration}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{detail.lesson.status}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Instructor</p>
                  <p className="font-semibold">{detail.instructorName}</p>
                </div>
              </div>
              {detail.lesson.description && (
                <p className="text-sm text-muted-foreground">{detail.lesson.description}</p>
              )}
              {detail.lesson.videoUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Youtube className="h-4 w-4 text-red-600" />
                  <a href={detail.lesson.videoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                    {detail.lesson.videoUrl}
                  </a>
                  {detail.lesson.isPrivateVideo && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">Private</span>
                  )}
                </div>
              )}
              {detail.quiz && (
                <div className="rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold text-ink">Linked Quiz</p>
                  <p className="text-sm text-muted-foreground">{detail.quiz.title}</p>
                  <Link href={`/admin/quizzes/${detail.quiz.id}/edit`} className="mt-1 text-xs font-semibold text-primary hover:underline">
                    Edit quiz →
                  </Link>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Updated {formatDate(detail.lesson.updatedAt)}</p>
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <Link href={`/admin/courses/${detail.lesson.courseId}/edit`} className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-semibold">
                Open Course
              </Link>
              <button type="button" onClick={() => { const row = items.find((i) => i.id === detail.lesson.id); if (row) openEdit(row); }} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">
                Edit Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSave} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">{editing ? "Edit Lesson" : "Add Lesson"}</h2>
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
                <span className={labelClass}>Section *</span>
                <select
                  value={form.sectionId}
                  onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                  className={selectClass}
                  required
                  disabled={!form.courseId || sections.length === 0}
                >
                  <option value="">
                    {!form.courseId ? "Select course first" : sections.length === 0 ? "No sections — add in course builder" : "Select section"}
                  </option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                {form.courseId && sections.length === 0 && (
                  <p className={helperClass}>
                    <Link href={`/admin/courses/${form.courseId}/edit`} className="text-primary underline">
                      Add curriculum sections in course builder
                    </Link>
                  </p>
                )}
              </label>
              <label className="block">
                <span className={labelClass}>Title *</span>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} required />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Type *</span>
                  <select
                    value={form.lessonType}
                    onChange={(e) => setForm((f) => ({ ...f, lessonType: e.target.value as LessonType }))}
                    className={selectClass}
                  >
                    <option value="video">Video</option>
                    <option value="text">Text</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Status</span>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Lesson["status"] }))} className={selectClass}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Duration *</span>
                  <input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className={inputClass} placeholder="e.g. 45m" required />
                </label>
                <label className="block">
                  <span className={labelClass}>Order</span>
                  <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} className={inputClass} min={1} />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Description</span>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={textareaClass + " min-h-[60px]"} />
              </label>

              {form.lessonType === "video" && (
                <>
                  <label className="block">
                    <span className={labelClass}>YouTube URL *</span>
                    <input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} className={inputClass} placeholder="https://youtube.com/watch?v=..." />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isPrivateVideo} onChange={(e) => setForm((f) => ({ ...f, isPrivateVideo: e.target.checked }))} />
                    Private / Unlisted YouTube video
                  </label>
                </>
              )}

              {(form.lessonType === "text" || form.lessonType === "assignment") && (
                <label className="block">
                  <span className={labelClass}>Content</span>
                  <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className={textareaClass + " min-h-[120px]"} />
                </label>
              )}

              {form.lessonType === "quiz" && (
                <QuizPicker
                  value={form.quizId}
                  onChange={(quizId) => setForm((f) => ({ ...f, quizId }))}
                  kind="lesson_quiz"
                  courseId={form.courseId}
                  instructorId={selectedCourse?.instructorId}
                  label="Select Quiz *"
                />
              )}
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
