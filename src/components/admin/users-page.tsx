"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type { Course, User, UserDetailPayload, UserInput, UserStats } from "@/lib/admin/types";
import {
  adminPageClass,
  adminKpiGridClass,
  adminFilterBarClass,
  adminPageActionsClass,
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

const ROLE_OPTIONS = [
  { label: "All Roles", value: "all" },
  { label: "Students", value: "student" },
  { label: "Instructors", value: "instructor" },
  { label: "Admins", value: "admin" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const EMPTY_FORM: UserInput = {
  name: "",
  email: "",
  role: "student",
  status: "active",
  phone: "",
  country: "",
  city: "",
  notes: "",
};

function roleBadge(role: User["role"]) {
  const map = {
    student: "bg-primary/10 text-primary",
    instructor: "bg-gold/20 text-maroon",
    admin: "bg-maroon/10 text-maroon",
  };
  return map[role];
}

function statusBadge(status: User["status"]) {
  const map = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    suspended: "bg-red-100 text-red-700",
  };
  return map[status];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<UserDetailPayload | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "enrollments" | "exams" | "certificates">("overview");
  const [enrollCourseId, setEnrollCourseId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const q = params.toString() ? `?${params}` : "";
      const [list, st] = await Promise.all([
        adminFetch<User[]>(`/api/admin/users${q}`),
        adminFetch<UserStats>("/api/admin/users?stats=true"),
      ]);
      setUsers(list);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    load();
    adminFetch<Course[]>("/api/admin/courses").then(setCourses).catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone ?? "",
      country: user.country ?? "",
      city: user.city ?? "",
      notes: user.notes ?? "",
    });
    setModalOpen(true);
  };

  const openDetail = async (user: User) => {
    try {
      const data = await adminFetch<UserDetailPayload>(`/api/admin/users/${user.id}`);
      setDetail(data);
      setDetailTab("overview");
      setEnrollCourseId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user detail");
    }
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await adminFetch(`/api/admin/users/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await adminFetch("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      }
      setModalOpen(false);
      await load();
      if (detail && editing?.id === detail.user.id) openDetail({ ...detail.user, ...form } as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (detail?.user.id === user.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const bulkStatus = async (status: User["status"]) => {
    if (selected.size === 0) return;
    try {
      await adminFetch("/api/admin/users/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selected), status }),
      });
      setSelected(new Set());
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk update failed");
    }
  };

  const enrollStudent = async () => {
    if (!detail || !enrollCourseId) return;
    try {
      await adminFetch("/api/admin/users/enroll", {
        method: "POST",
        body: JSON.stringify({ userId: detail.user.id, courseId: enrollCourseId }),
      });
      openDetail(detail.user);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrollment failed");
    }
  };

  const removeEnrollment = async (enrollmentId: string) => {
    if (!confirm("Remove this enrollment?")) return;
    try {
      await adminFetch(`/api/admin/users/enroll?enrollmentId=${enrollmentId}`, { method: "DELETE" });
      if (detail) openDetail(detail.user);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove enrollment");
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Role", "Status", "Phone", "Country", "City", "Joined"];
    const rows = users.map((u) =>
      [u.name, u.email, u.role, u.status, u.phone ?? "", u.country ?? "", u.city ?? "", u.createdAt].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  const kpis = useMemo(
    () => [
      { label: "Total Users", value: stats?.total ?? 0, icon: Users, tint: "from-maroon/15 to-maroon/5" },
      { label: "Students", value: stats?.students ?? 0, icon: BookOpen, tint: "from-primary/15 to-primary/5" },
      { label: "Instructors", value: stats?.instructors ?? 0, icon: UserCheck, tint: "from-gold/20 to-gold/5" },
      { label: "Active", value: stats?.active ?? 0, icon: Shield, tint: "from-emerald-500/15 to-emerald-500/5" },
    ],
    [stats],
  );

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="User Management"
        description="Manage students, instructors, admins & enrollments"
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button type="button" onClick={openCreate} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:flex-none">
              <Plus className="h-4 w-4" /> Add User
            </button>
          </>
        }
      />

      <div className={adminKpiGridClass}>
        {kpis.map((k) => (
          <div key={k.label} className={cn("rounded-2xl border border-border bg-gradient-to-br p-4", k.tint)}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <k.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-ink">{k.value}</p>
          </div>
        ))}
      </div>

      <div className={cn("rounded-2xl border border-border bg-card p-4", adminFilterBarClass)}>
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, country..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={adminFilterSelectClass}>
          {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="font-semibold">{selected.size} selected</span>
          <button type="button" onClick={() => bulkStatus("active")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Activate</button>
          <button type="button" onClick={() => bulkStatus("suspended")} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Suspend</button>
          <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold text-muted-foreground">Clear</button>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <AdminDesktopTable>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3"><input type="checkbox" checked={users.length > 0 && selected.size === users.length} onChange={toggleAll} /></th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(user.id)}
                      onChange={() => {
                        const next = new Set(selected);
                        if (next.has(user.id)) next.delete(user.id);
                        else next.add(user.id);
                        setSelected(next);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials(user.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", roleBadge(user.role))}>{user.role}</span></td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusBadge(user.status))}>{user.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{[user.city, user.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openDetail(user)} className="grid h-8 w-8 place-items-center rounded-md border" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => openEdit(user)} className="grid h-8 w-8 place-items-center rounded-md border" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => deleteUser(user)} className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-600" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
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
          <AdminLoadingState message="Loading users..." />
        ) : users.length === 0 ? (
          <AdminEmptyState message="No users found" />
        ) : (
          users.map((user) => (
            <AdminMobileCard key={user.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", roleBadge(user.role))}>{user.role}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusBadge(user.status))}>{user.status}</span>
                  </div>
                </div>
              </div>
              <AdminMobileRow label="Location">{[user.city, user.country].filter(Boolean).join(", ") || "—"}</AdminMobileRow>
              <AdminMobileRow label="Joined">{formatDate(user.createdAt)}</AdminMobileRow>
              <AdminMobileActions>
                <button type="button" onClick={() => openDetail(user)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button type="button" onClick={() => openEdit(user)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" onClick={() => deleteUser(user)} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AdminMobileActions>
            </AdminMobileCard>
          ))
        )}
      </AdminMobileList>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink">{editing ? "Edit User" : "Add New User"}</h2>
            <form onSubmit={saveUser} className="mt-4 space-y-3">
              {(
                [
                  ["name", "Full Name", "text", true],
                  ["email", "Email", "email", true],
                  ["phone", "Phone", "text", false],
                  ["city", "City", "text", false],
                  ["country", "Country", "text", false],
                ] as const
              ).map(([key, label, type, req]) => (
                <label key={key} className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}{req ? " *" : ""}</span>
                  <input
                    type={type}
                    required={req}
                    value={form[key as keyof UserInput] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role *</span>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status *</span>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as User["status"] })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</span>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
              </label>
              {form.role === "instructor" && (
                <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-maroon">An instructor profile will be auto-created when saved.</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {saving ? "Saving..." : editing ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setDetail(null)}>
          <div className="flex h-full w-full max-w-lg flex-col overflow-hidden bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(detail.user.name)}</span>
                <div>
                  <h2 className="text-lg font-bold text-ink">{detail.user.name}</h2>
                  <p className="text-sm text-muted-foreground">{detail.user.email}</p>
                  <div className="mt-1 flex gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", roleBadge(detail.user.role))}>{detail.user.role}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusBadge(detail.user.status))}>{detail.user.status}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="grid h-8 w-8 place-items-center rounded-lg border"><X className="h-4 w-4" /></button>
            </div>

            <div className={adminTabBarClass}>
              {(["overview", "enrollments", "exams", "certificates"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDetailTab(tab)}
                  className={cn("shrink-0 px-3 py-2.5 text-xs font-semibold capitalize", detailTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailTab === "overview" && (
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-muted-foreground">Phone</dt><dd className="font-semibold">{detail.user.phone || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Location</dt><dd className="font-semibold">{[detail.user.city, detail.user.country].filter(Boolean).join(", ") || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Joined</dt><dd className="font-semibold">{formatDate(detail.user.createdAt)}</dd></div>
                  <div><dt className="text-muted-foreground">Last Updated</dt><dd className="font-semibold">{formatDate(detail.user.updatedAt)}</dd></div>
                  {detail.user.instructorId && <div><dt className="text-muted-foreground">Instructor Profile</dt><dd className="font-mono text-xs">{detail.user.instructorId}</dd></div>}
                  {detail.user.notes && <div><dt className="text-muted-foreground">Notes</dt><dd className="text-ink">{detail.user.notes}</dd></div>}
                  <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
                    <div className="rounded-lg border p-3 text-center"><BookOpen className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-bold">{detail.enrollments.length}</p><p className="text-[10px] text-muted-foreground">Courses</p></div>
                    <div className="rounded-lg border p-3 text-center"><ClipboardList className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-bold">{detail.attempts.length}</p><p className="text-[10px] text-muted-foreground">Exams</p></div>
                    <div className="rounded-lg border p-3 text-center"><Award className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-bold">{detail.certificates.length}</p><p className="text-[10px] text-muted-foreground">Certs</p></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => openEdit(detail.user)} className="flex-1 rounded-lg border py-2 text-xs font-semibold">Edit User</button>
                    {detail.user.status !== "suspended" ? (
                      <button type="button" onClick={async () => {
                        const { name, email, role, phone, country, city, notes } = detail.user;
                        await adminFetch(`/api/admin/users/${detail.user.id}`, { method: "PUT", body: JSON.stringify({ name, email, role, phone, country, city, notes, status: "suspended" }) });
                        openDetail(detail.user);
                        load();
                      }} className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600"><UserX className="mr-1 inline h-3.5 w-3.5" />Suspend</button>
                    ) : (
                      <button type="button" onClick={async () => {
                        const { name, email, role, phone, country, city, notes } = detail.user;
                        await adminFetch(`/api/admin/users/${detail.user.id}`, { method: "PUT", body: JSON.stringify({ name, email, role, phone, country, city, notes, status: "active" }) });
                        openDetail(detail.user);
                        load();
                      }} className="flex-1 rounded-lg border py-2 text-xs font-semibold text-emerald-600"><UserCheck className="mr-1 inline h-3.5 w-3.5" />Activate</button>
                    )}
                  </div>
                </dl>
              )}

              {detailTab === "enrollments" && (
                <div className="space-y-4">
                  {detail.user.role === "student" && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <option value="">Select course to enroll...</option>
                        {courses.filter((c) => !detail.enrollments.some((e) => e.courseId === c.id && e.status !== "dropped")).map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                      <button type="button" onClick={enrollStudent} disabled={!enrollCourseId} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">Enroll</button>
                    </div>
                  )}
                  {detail.enrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No enrollments yet.</p>
                  ) : (
                    detail.enrollments.map((e) => (
                      <div key={e.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-ink">{e.courseTitle}</p>
                            <p className="text-xs text-muted-foreground">Enrolled {formatDate(e.enrolledAt)}</p>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", e.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>{e.status}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Progress</span><span>{e.progress}%</span></div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${e.progress}%` }} /></div>
                        </div>
                        {e.status === "active" && (
                          <button type="button" onClick={() => removeEnrollment(e.id)} className="mt-2 text-xs font-semibold text-red-600">Remove enrollment</button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === "exams" && (
                detail.attempts.length === 0 ? <p className="text-sm text-muted-foreground">No exam attempts yet.</p> : (
                  <div className="space-y-3">
                    {detail.attempts.map((a) => (
                      <div key={a.id} className="rounded-xl border border-border p-3">
                        <p className="font-semibold text-ink">{a.quizTitle}</p>
                        <p className="text-xs text-muted-foreground">{a.percentage}% · {a.passed ? "Passed" : "Failed"} · {formatDate(a.submittedAt ?? a.startedAt)}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {detailTab === "certificates" && (
                detail.certificates.length === 0 ? <p className="text-sm text-muted-foreground">No certificates earned yet.</p> : (
                  <div className="space-y-3">
                    {detail.certificates.map((cert) => (
                      <div key={cert.id} className="rounded-xl border border-border p-3">
                        <p className="font-semibold text-ink">{cert.quizTitle}</p>
                        <p className="text-xs text-muted-foreground">{cert.courseTitle} · {cert.percentage}%</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">{cert.certificateNo}</p>
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
