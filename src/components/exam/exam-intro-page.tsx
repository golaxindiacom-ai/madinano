"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, Play, User } from "lucide-react";
import { syncSessionFromServer, type StudentSession } from "@/lib/exam/student-session";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";

type ExamInfo = {
  id: string;
  title: string;
  description?: string;
  courseTitle?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  questions: number;
  maxAttempts: number;
};

export function ExamIntroPage({ examId }: { examId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");
  const backHref = courseId
    ? `/courses/${courseId}/learn${lessonId ? `?lesson=${lessonId}` : ""}`
    : "/exams";
  const backLabel = courseId ? "← Back to Course" : "← All Exams";
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    fetch(`/api/exams/${examId}`)
      .then((r) => r.json())
      .then((j) => setExam(j.data));
  }, [examId]);

  useEffect(() => {
    const next = `/exams/${examId}${courseId ? `?courseId=${courseId}` : ""}`;
    syncSessionFromServer().then((session) => {
      if (!session) {
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }
      setStudent(session);
      setAuthChecking(false);
    });
  }, [examId, courseId]);

  const start = async () => {
    if (!student) return;
    setStarting(true);
    setError("");
    try {
      const res = await fetch(`/api/exams/${examId}/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const qs = new URLSearchParams({ attempt: json.data.attempt.id });
      if (courseId) qs.set("courseId", courseId);
      if (lessonId) qs.set("lessonId", lessonId);
      router.push(`/exams/${examId}/take?${qs.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start");
      setStarting(false);
    }
  };

  if (authChecking || !exam || !student) {
    return (
      <div className="min-h-screen bg-background">
        <SiteTopBar />
        <SiteHeader />
        <p className="p-8 text-center text-muted-foreground">Loading exam...</p>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Examination"
        title={exam.title}
        subtitle={exam.courseTitle || exam.description || "Review the details below, then start when you are ready."}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Exams", href: "/exams" },
          { label: exam.title },
        ]}
      />
      <PageBand tone="process">
        <Container className="max-w-2xl">
          <Link href={backHref} className="text-sm font-semibold text-primary">
            {backLabel}
          </Link>
          <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
            {exam.description && exam.courseTitle ? (
              <p className="text-sm text-foreground/80">{exam.description}</p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: "Duration", val: `${exam.durationMinutes} min` },
                { icon: AlertTriangle, label: "Pass Score", val: `${exam.passingPercentage}%` },
                { label: "Questions", val: String(exam.questions) },
                { label: "Max Marks", val: String(exam.totalMarks) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/40 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{item.val}</p>
                </div>
              ))}
            </div>

            {exam.instructions && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase text-amber-800">Instructions</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">{exam.instructions}</p>
              </div>
            )}

            <div className="mt-6 space-y-2 border-t border-border pt-6">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" /> Taking as
              </p>
              <p className="text-sm font-bold text-ink">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.email}</p>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="button"
              disabled={starting}
              onClick={start}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <Play className="h-4 w-4" /> {starting ? "Starting..." : "Start Examination"}
            </button>
          </div>
        </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}
