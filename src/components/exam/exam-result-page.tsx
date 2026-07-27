"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, CheckCircle2, XCircle, Download, QrCode } from "lucide-react";
import type { Certificate, QuizAttempt } from "@/lib/admin/types";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function ExamResultPage({ examId, attemptId }: { examId: string; attemptId: string }) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");
  const courseHref = courseId
    ? `/courses/${courseId}/learn${lessonId ? `?lesson=${lessonId}` : ""}`
    : null;
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    fetch(`/api/exams/result/${attemptId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setAttempt(j.data.attempt);
          setCertificate(j.data.certificate ?? null);
        }
      });
  }, [attemptId]);

  if (!attempt) {
    return <div className="flex min-h-screen items-center justify-center">Loading results...</div>;
  }

  const mins = Math.floor(attempt.timeTakenSeconds / 60);
  const secs = attempt.timeTakenSeconds % 60;

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <main className="py-10">
        <Container className="max-w-3xl">
          <div className={cn(
            "rounded-2xl border p-8 text-center",
            attempt.passed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50",
          )}>
            {attempt.passed ? (
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}
            <h1 className="mt-4 text-2xl font-extrabold text-ink">
              {attempt.passed ? "Congratulations! You Passed" : "Exam Not Cleared"}
            </h1>
            <p className="mt-2 text-muted-foreground">{attempt.quizTitle}</p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/80 p-4">
                <p className="text-3xl font-extrabold text-ink">{attempt.percentage}%</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="rounded-xl bg-white/80 p-4">
                <p className="text-3xl font-extrabold text-ink">{attempt.score}/{attempt.totalMarks}</p>
                <p className="text-xs text-muted-foreground">Marks</p>
              </div>
              <div className="rounded-xl bg-white/80 p-4">
                <p className="text-3xl font-extrabold text-ink">{mins}m {secs}s</p>
                <p className="text-xs text-muted-foreground">Time Taken</p>
              </div>
            </div>
          </div>

          {attempt.autoSubmittedByProctor && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Exam was auto-submitted due to proctoring violations ({attempt.tabSwitchCount ?? 0} tab switches detected).
            </p>
          )}

          {/* Question-wise review */}
          {attempt.questionResults && attempt.questionResults.length > 0 && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-ink">Instant Result — Question Review</h2>
              <div className="mt-4 space-y-3">
                {attempt.questionResults.map((r, i) => (
                  <div key={r.questionId} className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    r.correct ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50",
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Q{i + 1}</span>
                      <span className={cn("font-bold", r.correct ? "text-emerald-600" : "text-red-600")}>
                        {r.marksAwarded > 0 ? `+${r.marksAwarded}` : r.marksAwarded} marks
                      </span>
                    </div>
                    {r.explanation && <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {certificate && (
            <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-gold/10 p-6">
              <div className="flex items-center gap-2 text-primary">
                <Award className="h-6 w-6" />
                <h2 className="text-lg font-bold">Certificate Issued!</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Certificate No: <strong className="text-ink">{certificate.certificateNo}</strong>
              </p>
              <Link
                href={`/certificates/${certificate.id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Download className="h-4 w-4" /> View Certificate & Download PDF
              </Link>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {courseHref && (
              <Link href={courseHref} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Back to Course
              </Link>
            )}
            <Link href="/exams" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">More Exams</Link>
            <Link href="/dashboard" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Dashboard</Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
