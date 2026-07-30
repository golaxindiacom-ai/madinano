"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/client";
import type {
  QuizAttempt,
  QuizAttemptDetailPayload,
  QuizAttemptListItem,
  QuizAttemptStats,
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

type QuizOption = { id: string; title: string; courseTitle?: string };
type StudentOption = { id: string; name: string; email: string };

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "In Progress", value: "in_progress" },
  { label: "Submitted", value: "submitted" },
  { label: "Timed Out", value: "timed_out" },
];

const RESULT_OPTIONS = [
  { label: "All Results", value: "all" },
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" },
  { label: "In Progress", value: "in_progress" },
];

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function statusBadge(status: QuizAttempt["status"]) {
  const map = {
    in_progress: "bg-amber-100 text-amber-700",
    submitted: "bg-blue-100 text-blue-700",
    timed_out: "bg-red-100 text-red-700",
  };
  return map[status];
}

export function ExamAttemptsPage() {
  const [items, setItems] = useState<QuizAttemptListItem[]>([]);
  const [stats, setStats] = useState<QuizAttemptStats | null>(null);
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [quizFilter, setQuizFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [violationsOnly, setViolationsOnly] = useState(false);
  const [detail, setDetail] = useState<QuizAttemptDetailPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (resultFilter !== "all") params.set("result", resultFilter);
      if (quizFilter) params.set("quizId", quizFilter);
      if (studentFilter) params.set("studentId", studentFilter);
      if (violationsOnly) params.set("violations", "true");
      const q = params.toString() ? `?${params}` : "";

      const [list, st, quizList, studentList] = await Promise.all([
        adminFetch<QuizAttemptListItem[]>(`/api/admin/quiz-attempts${q}`),
        adminFetch<QuizAttemptStats>("/api/admin/quiz-attempts?stats=true"),
        adminFetch<QuizOption[]>("/api/admin/quiz-attempts?quizzes=true"),
        adminFetch<StudentOption[]>("/api/admin/quiz-attempts?students=true"),
      ]);
      setItems(list);
      setStats(st);
      setQuizzes(quizList);
      setStudents(studentList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, resultFilter, quizFilter, studentFilter, violationsOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row: QuizAttemptListItem) => {
    try {
      const data = await adminFetch<QuizAttemptDetailPayload>(`/api/admin/quiz-attempts/${row.id}`);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    }
  };

  const remove = async (row: QuizAttemptListItem) => {
    if (!confirm(`Delete attempt by ${row.studentName} for "${row.quizTitle}"?`)) return;
    try {
      await adminFetch(`/api/admin/quiz-attempts/${row.id}`, { method: "DELETE" });
      if (detail?.attempt.id === row.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const headers = ["Student", "Email", "Exam", "Score", "Result", "Status", "Violations", "Submitted"];
    const rows = items.map((a) =>
      [
        a.studentName,
        a.studentEmail,
        a.quizTitle,
        a.status === "in_progress" ? "" : `${a.percentage}%`,
        a.status === "in_progress" ? "In Progress" : a.passed ? "Passed" : "Failed",
        a.status,
        a.violationCount,
        a.submittedAt ?? "",
      ].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exam-attempts-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Exam Attempts"
        description="Monitor student exam attempts, scores, proctoring & certificates"
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold sm:flex-none">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </>
        }
      />

      {stats && (
        <div className={adminKpiGridClass}>
          {[
            { label: "Total", value: stats.total, icon: FileText },
            { label: "In Progress", value: stats.inProgress, icon: Clock },
            { label: "Submitted", value: stats.submitted, icon: CheckCircle2 },
            { label: "Timed Out", value: stats.timedOut, icon: XCircle },
            { label: "Passed", value: stats.passed, icon: CheckCircle2 },
            { label: "Failed", value: stats.failed, icon: XCircle },
            { label: "Violations", value: stats.withViolations, icon: ShieldAlert },
            { label: "Certificates", value: stats.certificatesIssued, icon: Award },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, email, exam..." className={cn(inputClass, "pl-9")} />
        </div>
        <select value={quizFilter} onChange={(e) => setQuizFilter(e.target.value)} className={adminFilterSelectClass}>
          <option value="">All Exams</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className={adminFilterSelectClass}>
          <option value="">All Students</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className={adminFilterSelectClass}>
          {RESULT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
          <input type="checkbox" checked={violationsOnly} onChange={(e) => setViolationsOnly(e.target.checked)} />
          Violations only
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminDesktopTable>
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Exam</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Proctoring</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading attempts...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No exam attempts yet</td></tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{a.studentName}</p>
                    <p className="text-xs text-muted-foreground">{a.studentEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.quizTitle}</p>
                    {a.courseTitle && <p className="text-xs text-muted-foreground">{a.courseTitle}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {a.status === "in_progress" ? "—" : `${a.percentage}% (${a.score}/${a.totalMarks})`}
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "in_progress" ? (
                      <span className="text-amber-600">In Progress</span>
                    ) : a.passed ? (
                      <span className="font-semibold text-emerald-600">Passed</span>
                    ) : (
                      <span className="font-semibold text-red-600">Failed</span>
                    )}
                    {a.hasCertificate && (
                      <p className="mt-0.5 text-xs text-primary">Certificate issued</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      a.violationCount > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
                    )}>
                      <Eye className="h-3 w-3" />
                      {a.violationCount} violations
                    </span>
                    {a.autoSubmittedByProctor && (
                      <p className="mt-1 text-[10px] text-red-500">Auto-submitted</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(a.status))}>
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {a.submittedAt ? formatDate(a.submittedAt) : formatDate(a.startedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openDetail(a)} className="rounded-md border border-border p-1.5 hover:bg-background" title="View detail">
                        <Users className="h-3.5 w-3.5" />
                      </button>
                      {a.status !== "in_progress" && (
                        <Link href={`/exams/${a.quizId}/result/${a.id}`} target="_blank" className="rounded-md border border-border p-1.5 hover:bg-background" title="View result">
                          <FileText className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <button type="button" onClick={() => remove(a)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
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
          <AdminLoadingState message="Loading attempts..." />
        ) : items.length === 0 ? (
          <AdminEmptyState message="No exam attempts yet" />
        ) : (
          items.map((a) => (
            <AdminMobileCard key={a.id}>
              <p className="font-semibold text-ink">{a.studentName}</p>
              <p className="text-xs text-muted-foreground">{a.quizTitle}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusBadge(a.status))}>{a.status.replace("_", " ")}</span>
                {a.status !== "in_progress" && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", a.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                    {a.passed ? "Passed" : "Failed"}
                  </span>
                )}
              </div>
              <AdminMobileRow label="Score">
                {a.status === "in_progress" ? "—" : `${a.percentage}% (${a.score}/${a.totalMarks})`}
              </AdminMobileRow>
              <AdminMobileRow label="Violations">{a.violationCount}</AdminMobileRow>
              <AdminMobileRow label="Submitted">{a.submittedAt ? formatDate(a.submittedAt) : formatDate(a.startedAt)}</AdminMobileRow>
              <AdminMobileActions>
                <button type="button" onClick={() => openDetail(a)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Users className="h-3.5 w-3.5" /> View
                </button>
                {a.status !== "in_progress" && (
                  <Link href={`/exams/${a.quizId}/result/${a.id}`} target="_blank" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                    <FileText className="h-3.5 w-3.5" /> Result
                  </Link>
                )}
                <button type="button" onClick={() => remove(a)} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">
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
                <h2 className="text-lg font-bold text-ink">{detail.attempt.studentName}</h2>
                <p className="text-xs text-muted-foreground">{detail.attempt.quizTitle}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Score</p>
                  <p className="font-semibold">
                    {detail.attempt.status === "in_progress"
                      ? "—"
                      : `${detail.attempt.percentage}% (${detail.attempt.score}/${detail.attempt.totalMarks})`}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Time Taken</p>
                  <p className="font-semibold">{formatDuration(detail.attempt.timeTakenSeconds)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-semibold">{formatDate(detail.attempt.startedAt)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-semibold">{detail.attempt.submittedAt ? formatDate(detail.attempt.submittedAt) : "—"}</p>
                </div>
              </div>

              {detail.certificate && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-ink">Certificate Issued</p>
                  <p className="text-xs text-muted-foreground">{detail.certificate.certificateNo}</p>
                  <Link href={`/certificates/${detail.certificate.id}`} target="_blank" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                    View certificate →
                  </Link>
                </div>
              )}

              {(detail.attempt.proctoringViolations?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Proctoring Violations</h3>
                  <ul className="mt-2 space-y-2">
                    {detail.attempt.proctoringViolations!.map((v, i) => (
                      <li key={i} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
                        <span className="font-semibold capitalize">{v.type.replace("_", " ")}</span>
                        {v.detail && <span className="text-muted-foreground"> — {v.detail}</span>}
                        <p className="text-muted-foreground">{formatDate(v.at)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.attempt.questionResults && detail.attempt.questionResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Question Breakdown</h3>
                  <ul className="mt-2 space-y-2">
                    {detail.attempt.questionResults.map((qr, i) => (
                      <li key={qr.questionId} className="rounded-lg border border-border px-3 py-2 text-sm">
                        <p className="font-medium">Q{i + 1}: {qr.correct ? "Correct" : "Incorrect"} ({qr.marksAwarded} marks)</p>
                        {qr.explanation && <p className="mt-1 text-xs text-muted-foreground">{qr.explanation}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.quiz && detail.attempt.status !== "in_progress" && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Exam Info</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Passing: {detail.quiz.passingPercentage}% · Duration: {detail.quiz.durationMinutes} min
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <Link href={`/admin/users`} className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-semibold">
                View Student
              </Link>
              {detail.attempt.status !== "in_progress" && (
                <Link href={`/exams/${detail.attempt.quizId}/result/${detail.attempt.id}`} target="_blank" className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground">
                  Full Result
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
