"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type { Instructor, InstructorDetailPayload, InstructorInput, InstructorStats } from "@/lib/admin/types";
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
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Inactive", value: "inactive" },
];

const EMPTY_FORM: InstructorInput = {
  name: "",
  email: "",
  expertise: "",
  bio: "",
  phone: "",
  country: "",
  rating: 0,
  status: "pending",
};

function statusBadge(status: Instructor["status"]) {
  const map = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-gold/20 text-maroon",
    inactive: "bg-slate-100 text-slate-600",
  };
  return map[status];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function InstructorsPage() {
  const [items, setItems] = useState<Instructor[]>([]);
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [form, setForm] = useState<InstructorInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<InstructorDetailPayload | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "courses" | "quizzes">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const q = params.toString() ? `?${params}` : "";
      const [list, st] = await Promise.all([
        adminFetch<Instructor[]>(`/api/admin/instructors${q}`),
        adminFetch<InstructorStats>("/api/admin/instructors?stats=true"),
      ]);
      setItems(list);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row: Instructor) => {
    setEditing(row);
    setForm({
      name: row.name,
      email: row.email,
      expertise: row.expertise,
      bio: row.bio ?? "",
      phone: row.phone ?? "",
      country: row.country ?? "",
      rating: row.rating,
      status: row.status,
    });
    setModalOpen(true);
  };

  const openDetail = async (row: Instructor) => {
    try {
      const data = await adminFetch<InstructorDetailPayload>(`/api/admin/instructors/${row.id}`);
      setDetail(data);
      setDetailTab("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await adminFetch(`/api/admin/instructors/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await adminFetch("/api/admin/instructors", { method: "POST", body: JSON.stringify(form) });
      }
      setModalOpen(false);
      load();
      if (detail && editing?.id === detail.instructor.id) openDetail({ ...detail.instructor, ...form } as Instructor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Instructor) => {
    if (!confirm(`Delete instructor "${row.name}"?`)) return;
    try {
      await adminFetch(`/api/admin/instructors/${row.id}`, { method: "DELETE" });
      if (detail?.instructor.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Expertise", "Courses", "Students", "Rating", "Status"];
    const rows = items.map((i) =>
      [i.name, i.email, i.expertise, i.courses, i.students, i.rating, i.status].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instructors-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = useMemo(
    () => [
      { label: "Total Instructors", value: stats?.total ?? 0, icon: GraduationCap },
      { label: "Active", value: stats?.active ?? 0, icon: User },
      { label: "Total Courses", value: stats?.totalCourses ?? 0, icon: BookOpen },
      { label: "Students Taught", value: stats?.totalStudents ?? 0, icon: Users },
    ],
    [stats],
  );

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Instructor Management"
        description="Manage instructors, link user accounts & assign courses"
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={openCreate} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:flex-none">
              <Plus className="h-4 w-4" /> Add Instructor
            </button>
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

      <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-maroon">
        <strong>Flow:</strong> Add instructor here → user account auto-created → assign in{" "}
        <Link href="/admin/courses" className="font-semibold underline">Courses</Link> → instructor logs in at{" "}
        <Link href="/instructor-dashboard" className="font-semibold underline">Instructor Dashboard</Link>
      </div>

      <div className={cn("rounded-2xl border border-border bg-card p-4", adminFilterBarClass)}>
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, expertise..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <AdminDesktopTable>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Expertise</th>
              <th className="px-4 py-3">Courses</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No instructors yet</td></tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-bold text-maroon">
                        {initials(row.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                        {row.userId && <p className="text-[10px] text-emerald-600">✓ User linked</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.expertise}</td>
                  <td className="px-4 py-3 font-semibold">{row.courses}</td>
                  <td className="px-4 py-3 font-semibold">{row.students}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{row.rating || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusBadge(row.status))}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openDetail(row)} className="grid h-8 w-8 place-items-center rounded-md border"><Eye className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => openEdit(row)} className="grid h-8 w-8 place-items-center rounded-md border"><Pencil className="h-3.5 w-3.5" /></button>
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
          <AdminEmptyState message="No instructors yet" />
        ) : (
          items.map((row) => (
            <AdminMobileCard key={row.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-bold text-maroon">
                  {initials(row.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusBadge(row.status))}>{row.status}</span>
                  </div>
                </div>
              </div>
              <AdminMobileRow label="Expertise">{row.expertise}</AdminMobileRow>
              <AdminMobileRow label="Courses">{row.courses}</AdminMobileRow>
              <AdminMobileRow label="Students">{row.students}</AdminMobileRow>
              <AdminMobileRow label="Rating">
                <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{row.rating || "—"}</span>
              </AdminMobileRow>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink">{editing ? "Edit Instructor" : "Add Instructor"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">A user account with instructor role will be created automatically.</p>
            <form onSubmit={save} className="mt-4 space-y-3">
              {(
                [
                  ["name", "Full Name", "text", true],
                  ["email", "Email", "email", true],
                  ["expertise", "Expertise / Subject", "text", true],
                  ["phone", "Phone", "text", false],
                  ["country", "Country", "text", false],
                ] as const
              ).map(([key, label, type, req]) => (
                <label key={key} className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}{req ? " *" : ""}</span>
                  <input
                    type={type}
                    required={req}
                    value={form[key] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</span>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={3} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</span>
                  <input type="number" min={0} max={5} step={0.1} value={form.rating ?? 0} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status *</span>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Instructor["status"] })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {saving ? "Saving..." : editing ? "Update" : "Create Instructor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setDetail(null)}>
          <div className="flex h-full w-full max-w-lg flex-col overflow-hidden bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/20 text-sm font-bold text-maroon">{initials(detail.instructor.name)}</span>
                <div>
                  <h2 className="text-lg font-bold text-ink">{detail.instructor.name}</h2>
                  <p className="text-sm text-muted-foreground">{detail.instructor.expertise}</p>
                  <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusBadge(detail.instructor.status))}>{detail.instructor.status}</span>
                </div>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="grid h-8 w-8 place-items-center rounded-lg border"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex gap-1 border-b border-border px-4">
              {(["overview", "courses", "quizzes"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setDetailTab(tab)} className={cn("px-3 py-2.5 text-xs font-semibold capitalize", detailTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailTab === "overview" && (
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-muted-foreground">Email</dt><dd className="font-semibold">{detail.instructor.email}</dd></div>
                  <div><dt className="text-muted-foreground">Phone</dt><dd className="font-semibold">{detail.instructor.phone || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Country</dt><dd className="font-semibold">{detail.instructor.country || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Rating</dt><dd className="font-semibold">{detail.instructor.rating || "—"}</dd></div>
                  {detail.instructor.bio && <div><dt className="text-muted-foreground">Bio</dt><dd>{detail.instructor.bio}</dd></div>}
                  <div><dt className="text-muted-foreground">User Account</dt><dd className="font-semibold">{detail.user ? `${detail.user.name} (${detail.user.status})` : "Not linked"}</dd></div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="rounded-lg border p-3 text-center"><BookOpen className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-bold">{detail.courses.length}</p><p className="text-[10px] text-muted-foreground">Courses</p></div>
                    <div className="rounded-lg border p-3 text-center"><Users className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-bold">{detail.uniqueStudents}</p><p className="text-[10px] text-muted-foreground">Students</p></div>
                    <div className="rounded-lg border p-3 text-center"><ClipboardList className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-bold">{detail.quizzes.length}</p><p className="text-[10px] text-muted-foreground">Quizzes</p></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => openEdit(detail.instructor)} className="flex-1 rounded-lg border py-2 text-xs font-semibold">Edit</button>
                    <Link href="/admin/courses/new" className="flex-1 rounded-lg bg-primary py-2 text-center text-xs font-semibold text-primary-foreground">Create Course</Link>
                  </div>
                </dl>
              )}

              {detailTab === "courses" && (
                detail.courses.length === 0 ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
                    <Link href="/admin/courses/new" className="mt-3 inline-block text-sm font-semibold text-primary">Create Course →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detail.courses.map((c) => (
                      <div key={c.id} className="rounded-xl border border-border p-3">
                        <p className="font-semibold text-ink">{c.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{c.status} · {c.mode} · {c.enrollments} enrolled</p>
                        <Link href={`/admin/courses/${c.id}/edit`} className="mt-2 inline-block text-xs font-semibold text-primary">Edit Course →</Link>
                      </div>
                    ))}
                  </div>
                )
              )}

              {detailTab === "quizzes" && (
                detail.quizzes.length === 0 ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No quizzes yet.</p>
                    <Link href="/instructor-dashboard/quizzes/new" className="mt-3 inline-block text-sm font-semibold text-primary">Create Quiz →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detail.quizzes.map((q) => (
                      <div key={q.id} className="rounded-xl border border-border p-3">
                        <p className="font-semibold text-ink">{q.title}</p>
                        <p className="text-xs text-muted-foreground">{q.questions} questions · {q.durationMinutes} min · {q.quizKind ?? "library"}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
