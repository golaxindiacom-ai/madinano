"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type {
  CurriculumSection,
  LiveClass,
  LiveClassDetailPayload,
  LiveClassInput,
  LiveClassListItem,
  LiveClassPlatform,
  LiveClassStats,
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

type PlatformOption = { value: string; label: string };

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Live", value: "live" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const EMPTY_FORM: LiveClassInput = {
  title: "",
  courseId: "",
  sectionId: "",
  instructorName: "",
  description: "",
  scheduledAt: "",
  duration: "1h",
  platform: "google_meet",
  meetingUrl: "",
  meetingId: "",
  passcode: "",
  youtubeLiveUrl: "",
  status: "scheduled",
};

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadge(status: LiveClass["status"]) {
  switch (status) {
    case "live":
      return "bg-rose-100 text-rose-700";
    case "scheduled":
      return "bg-sky-100 text-sky-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function LiveClassesListPage() {
  const [items, setItems] = useState<LiveClassListItem[]>([]);
  const [stats, setStats] = useState<LiveClassStats | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LiveClassListItem | null>(null);
  const [form, setForm] = useState<LiveClassInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<LiveClassDetailPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (upcomingOnly) params.set("upcoming", "true");
      const q = params.toString() ? `?${params}` : "";

      const [list, st, courseList, platformList] = await Promise.all([
        adminFetch<LiveClassListItem[]>(`/api/admin/live-classes${q}`),
        adminFetch<LiveClassStats>("/api/admin/live-classes?stats=true"),
        adminFetch<CourseOption[]>("/api/admin/live-classes?courses=true"),
        adminFetch<PlatformOption[]>("/api/admin/live-classes?platforms=true"),
      ]);
      setItems(list);
      setStats(st);
      setCourses(courseList);
      setPlatforms(platformList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, courseFilter, platformFilter, upcomingOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseId),
    [courses, form.courseId],
  );

  const sections = selectedCourse?.curriculum ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row: LiveClassListItem) => {
    setEditing(row);
    setForm({
      title: row.title,
      courseId: row.courseId ?? "",
      sectionId: row.sectionId ?? "",
      instructorName: row.instructorName,
      description: row.description ?? "",
      scheduledAt: toDatetimeLocal(row.scheduledAt),
      duration: row.duration,
      platform: row.platform,
      meetingUrl: row.meetingUrl ?? "",
      meetingId: row.meetingId ?? "",
      passcode: row.passcode ?? "",
      youtubeLiveUrl: row.youtubeLiveUrl ?? "",
      status: row.status,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await adminFetch(`/api/admin/live-classes/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch("/api/admin/live-classes", {
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

  const openDetail = async (row: LiveClassListItem) => {
    try {
      const data = await adminFetch<LiveClassDetailPayload>(`/api/admin/live-classes/${row.id}`);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const setStatus = async (row: LiveClassListItem, status: LiveClass["status"]) => {
    try {
      await adminFetch(`/api/admin/live-classes/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
      if (detail?.liveClass.id === row.id) openDetail(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  };

  const remove = async (row: LiveClassListItem) => {
    if (!confirm(`Delete live class "${row.title}"?`)) return;
    try {
      await adminFetch(`/api/admin/live-classes/${row.id}`, { method: "DELETE" });
      if (detail?.liveClass.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Title", "Instructor", "Course", "Platform", "Scheduled", "Duration", "Enrolled", "Status"];
    const rows = items.map((l) =>
      [l.title, l.instructorName, l.courseTitle ?? "", l.platformLabel, l.scheduledAt, l.duration, l.enrolled, l.status].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "live-classes-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Live Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule & manage live sessions across courses
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> New Live Class
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
        <span className="font-semibold">How live classes work:</span>{" "}
        Add sessions here or from{" "}
        <Link href="/admin/courses" className="font-semibold text-primary underline">
          Course Builder
        </Link>
        . Students join via{" "}
        <Link href="/live-classes" target="_blank" className="font-semibold text-primary underline">
          public Live Classes page
        </Link>
        .
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            { label: "Total", value: stats.total, icon: Video },
            { label: "Scheduled", value: stats.scheduled, icon: Calendar },
            { label: "Live Now", value: stats.live, icon: Radio },
            { label: "Completed", value: stats.completed, icon: CheckCircle2 },
            { label: "Cancelled", value: stats.cancelled, icon: Ban },
            { label: "Upcoming", value: stats.upcoming, icon: Clock },
            { label: "Enrolled", value: stats.totalEnrolled, icon: Users },
            { label: "Courses", value: stats.coursesWithLiveClasses, icon: Video },
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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, instructor, course..."
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectClass}>
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className={selectClass}>
          <option value="all">All Platforms</option>
          {platforms.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={upcomingOnly} onChange={(e) => setUpcomingOnly(e.target.checked)} />
          Upcoming only
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className={cn(cardClass, "overflow-x-auto")}>
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading live classes...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No live classes yet</td></tr>
            ) : (
              items.map((l) => (
                <tr key={l.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.instructorName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{l.courseTitle ?? "—"}</p>
                    {l.sectionTitle && <p className="text-xs text-muted-foreground">{l.sectionTitle}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs">{l.platformLabel}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{formatDate(l.scheduledAt)}</p>
                    <p className="text-[10px] text-muted-foreground">{l.duration}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{l.enrolled}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(l.status))}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {l.joinUrl && (
                        <a href={l.joinUrl} target="_blank" rel="noreferrer" className="rounded-md border border-border p-1.5 hover:bg-background" title="Join">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button type="button" onClick={() => openDetail(l)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Details">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => openEdit(l)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {l.status === "scheduled" && (
                        <button type="button" onClick={() => setStatus(l, "live")} className="rounded-md border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50" title="Go Live">
                          <Radio className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {l.status === "live" && (
                        <button type="button" onClick={() => setStatus(l, "completed")} className="rounded-md border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50" title="Mark Completed">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => remove(l)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">{editing ? "Edit Live Class" : "New Live Class"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Title *</label>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Course</label>
                <select className={selectClass} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, sectionId: "" })}>
                  <option value="">Standalone session</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Section</label>
                <select className={selectClass} value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} disabled={!form.courseId}>
                  <option value="">No section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Instructor</label>
                <input className={inputClass} value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} placeholder="Auto from course if empty" />
              </div>
              <div>
                <label className={labelClass}>Platform *</label>
                <select className={selectClass} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as LiveClassPlatform })}>
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Scheduled At *</label>
                <input type="datetime-local" className={inputClass} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Duration *</label>
                <input className={inputClass} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 1h 30m" />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LiveClass["status"] })}>
                  {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea className={textareaClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Meeting URL *</label>
                <input className={inputClass} value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="https://meet.google.com/..." />
              </div>
              {form.platform === "zoom" && (
                <>
                  <div>
                    <label className={labelClass}>Meeting ID</label>
                    <input className={inputClass} value={form.meetingId} onChange={(e) => setForm({ ...form, meetingId: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Passcode</label>
                    <input className={inputClass} value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })} />
                  </div>
                </>
              )}
              {form.platform === "youtube" && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>YouTube Live URL</label>
                  <input className={inputClass} value={form.youtubeLiveUrl} onChange={(e) => setForm({ ...form, youtubeLiveUrl: e.target.value })} placeholder="https://youtube.com/live/..." />
                  <p className={helperClass}>Used as primary join link for YouTube sessions</p>
                </div>
              )}
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
                <h2 className="text-lg font-bold text-ink">{detail.liveClass.title}</h2>
                <p className="text-xs text-muted-foreground">{detail.liveClass.instructorName}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {detail.liveClass.description && (
                <p className="text-sm text-muted-foreground">{detail.liveClass.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Course</p>
                  <p className="font-semibold">{detail.courseTitle ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Platform</p>
                  <p className="font-semibold">{detail.liveClass.platformLabel}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Scheduled</p>
                  <p className="font-semibold">{formatDate(detail.liveClass.scheduledAt)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Enrolled</p>
                  <p className="font-semibold">{detail.liveClass.enrolled}</p>
                </div>
              </div>
              {detail.liveClass.joinUrl && (
                <div>
                  <p className="text-sm font-semibold text-ink">Join Link</p>
                  <a href={detail.liveClass.joinUrl} target="_blank" rel="noreferrer" className="mt-1 break-all text-sm text-primary hover:underline">
                    {detail.liveClass.joinUrl}
                  </a>
                </div>
              )}
              {detail.liveClass.meetingId && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Meeting ID:</span>{" "}
                  <span className="font-mono font-semibold">{detail.liveClass.meetingId}</span>
                  {detail.liveClass.passcode && (
                    <span className="ml-3 text-muted-foreground">Passcode: <span className="font-mono">{detail.liveClass.passcode}</span></span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <button type="button" onClick={() => { openEdit(detail.liveClass); setDetail(null); }} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold">
                Edit
              </button>
              {detail.liveClass.joinUrl && (
                <a href={detail.liveClass.joinUrl} target="_blank" rel="noreferrer" className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground">
                  Join Session
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
