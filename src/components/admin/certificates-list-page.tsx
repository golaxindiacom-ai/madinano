"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Ban,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import { CertificatePreviewModal } from "@/components/exam/certificate-preview-modal";
import { useCertificateSettings } from "@/components/exam/use-certificate-settings";
import type {
  Certificate,
  CertificateDetailPayload,
  CertificateListItem,
  CertificateStats,
  CertificateTemplateId,
} from "@/lib/admin/types";
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

type StudentOption = { id: string; name: string; email: string };
type TemplateOption = { value: string; label: string };

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Issued", value: "issued" },
  { label: "Revoked", value: "revoked" },
];

function statusBadge(status: Certificate["status"]) {
  return status === "issued"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";
}

export function CertificatesListPage() {
  const [items, setItems] = useState<CertificateListItem[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [detail, setDetail] = useState<CertificateDetailPayload | null>(null);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const { settings } = useCertificateSettings();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (studentFilter) params.set("studentId", studentFilter);
      if (templateFilter !== "all") params.set("template", templateFilter);
      const q = params.toString() ? `?${params}` : "";

      const [list, st, studentList, templateList] = await Promise.all([
        adminFetch<CertificateListItem[]>(`/api/admin/certificates${q}`),
        adminFetch<CertificateStats>("/api/admin/certificates?stats=true"),
        adminFetch<StudentOption[]>("/api/admin/certificates?students=true"),
        adminFetch<TemplateOption[]>("/api/admin/certificates?templates=true"),
      ]);
      setItems(list);
      setStats(st);
      setStudents(studentList);
      setTemplates(templateList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, studentFilter, templateFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row: CertificateListItem) => {
    try {
      const data = await adminFetch<CertificateDetailPayload>(`/api/admin/certificates/${row.id}`);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const toggleStatus = async (row: CertificateListItem) => {
    const next = row.status === "issued" ? "revoked" : "issued";
    const msg = next === "revoked"
      ? `Revoke certificate ${row.certificateNo}? It will fail verification.`
      : `Re-issue certificate ${row.certificateNo}?`;
    if (!confirm(msg)) return;
    try {
      await adminFetch(`/api/admin/certificates/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      load();
      if (detail?.certificate.id === row.id) openDetail(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  };

  const remove = async (row: CertificateListItem) => {
    if (!confirm(`Delete certificate ${row.certificateNo}? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/admin/certificates/${row.id}`, { method: "DELETE" });
      if (detail?.certificate.id === row.id) setDetail(null);
      if (previewCert?.id === row.id) setPreviewCert(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Certificate No", "Student", "Email", "Course", "Exam", "Score %", "Template", "Status", "Issued"];
    const rows = items.map((c) =>
      [c.certificateNo, c.studentName, c.studentEmail ?? "", c.courseTitle, c.quizTitle, c.percentage, c.templateLabel, c.status, c.issuedAt].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificates-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Certificates"
        description="Manage issued certificates, verification & revocation"
        actions={
          <>
            <Link href="/admin/settings" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Award className="h-4 w-4" /> Certificate Settings
            </Link>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </>
        }
      />

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">How certificates are issued:</span>{" "}
        Students pass exams with &quot;Issue certificate on pass&quot; enabled in{" "}
        <Link href="/admin/quizzes" className="font-semibold text-primary underline">
          Quiz Builder
        </Link>
        . Customize org name & signatures in{" "}
        <Link href="/admin/settings" className="font-semibold text-primary underline">
          Settings
        </Link>
        .
      </div>

      {stats && (
        <div className={adminKpiGridClass}>
          {[
            { label: "Total", value: stats.total, icon: Award },
            { label: "Issued", value: stats.issued, icon: CheckCircle2 },
            { label: "Revoked", value: stats.revoked, icon: Ban },
            { label: "This Month", value: stats.thisMonth, icon: ShieldCheck },
            { label: "Students", value: stats.uniqueStudents, icon: Users },
            { label: "Avg Score", value: `${stats.averageScore}%`, icon: Award },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cert no, student, course..." className={cn(inputClass, "pl-9")} />
        </div>
        <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className={adminFilterSelectClass}>
          <option value="">All Students</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className={adminFilterSelectClass}>
          <option value="all">All Templates</option>
          {templates.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminDesktopTable>
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Certificate</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course / Exam</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading certificates...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No certificates issued yet</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-semibold text-ink">{c.certificateNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{c.studentName}</p>
                    <p className="text-xs text-muted-foreground">{c.studentEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{c.quizTitle}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{c.percentage}%</td>
                  <td className="px-4 py-3 text-xs">{c.templateLabel}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(c.status))}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.issuedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setPreviewCert(c)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Preview">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <Link href={`/certificates/verify/${c.certificateNo}`} target="_blank" className="rounded-md border border-border p-1.5 hover:bg-background" title="Verify">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </Link>
                      <button type="button" onClick={() => openDetail(c)} className="rounded-md border border-border p-1.5 hover:bg-background" title="Details">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => toggleStatus(c)} className="rounded-md border border-border p-1.5 hover:bg-background" title={c.status === "issued" ? "Revoke" : "Re-issue"}>
                        {c.status === "issued" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <button type="button" onClick={() => remove(c)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
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
          <AdminLoadingState message="Loading certificates..." />
        ) : items.length === 0 ? (
          <AdminEmptyState message="No certificates issued yet" />
        ) : (
          items.map((c) => (
            <AdminMobileCard key={c.id}>
              <p className="font-mono text-xs font-semibold text-ink">{c.certificateNo}</p>
              <p className="font-semibold text-ink">{c.studentName}</p>
              <div className="mt-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(c.status))}>{c.status}</span>
              </div>
              <AdminMobileRow label="Course">{c.courseTitle}</AdminMobileRow>
              <AdminMobileRow label="Exam">{c.quizTitle}</AdminMobileRow>
              <AdminMobileRow label="Score">{c.percentage}%</AdminMobileRow>
              <AdminMobileRow label="Template">{c.templateLabel}</AdminMobileRow>
              <AdminMobileRow label="Issued">{formatDate(c.issuedAt)}</AdminMobileRow>
              <AdminMobileActions>
                <button type="button" onClick={() => setPreviewCert(c)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button type="button" onClick={() => openDetail(c)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <ExternalLink className="h-3.5 w-3.5" /> Details
                </button>
                <button type="button" onClick={() => toggleStatus(c)} className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold">
                  {c.status === "issued" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
              </AdminMobileActions>
            </AdminMobileCard>
          ))
        )}
      </AdminMobileList>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-md flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{detail.certificate.certificateNo}</h2>
                <p className="text-xs text-muted-foreground">{detail.certificate.studentName}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Score</p>
                  <p className="font-semibold">{detail.certificate.percentage}%</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Template</p>
                  <p className="font-semibold">{detail.certificate.templateLabel}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{detail.certificate.status}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Issued</p>
                  <p className="font-semibold">{formatDate(detail.certificate.issuedAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Verification</p>
                <Link href={detail.verifyPath} target="_blank" className="mt-1 text-sm text-primary hover:underline break-all">
                  {detail.certificate.verifyUrl}
                </Link>
              </div>
              {detail.attempt && (
                <div>
                  <p className="text-sm font-semibold text-ink">Linked Exam Attempt</p>
                  <p className="text-sm text-muted-foreground">
                    {detail.attempt.passed ? "Passed" : "Failed"} · {detail.attempt.percentage}%
                  </p>
                  <Link href={`/exams/${detail.certificate.quizId}/result/${detail.attempt.id}`} target="_blank" className="text-xs font-semibold text-primary hover:underline">
                    View attempt result →
                  </Link>
                </div>
              )}
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <button type="button" onClick={() => { setPreviewCert(detail.certificate); }} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold">
                Preview
              </button>
              <Link href={`/certificates/${detail.certificate.id}`} target="_blank" className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground">
                Open Certificate
              </Link>
            </div>
          </div>
        </div>
      )}

      {previewCert && settings && (
        <CertificatePreviewModal
          cert={previewCert}
          settings={settings}
          open={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </div>
  );
}
