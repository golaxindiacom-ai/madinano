"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, Eye, Maximize, Send, ShieldAlert, X } from "lucide-react";
import { getStudentSession } from "@/lib/exam/student-session";
import { useExamProctor } from "@/lib/exam/use-exam-proctor";
import { cn } from "@/lib/utils";

type ExamQ = {
  id: string;
  text: string;
  type: "mcq" | "true_false" | "multi_select";
  options: { id: string; text: string }[];
  marks: number;
  order: number;
};

type ExamData = {
  id: string;
  title: string;
  durationMinutes: number;
  questionItems: ExamQ[];
  enableProctoring?: boolean;
  maxProctorViolations?: number;
  autoSubmitOnProctorViolation?: boolean;
  requireFullscreen?: boolean;
};

export function ExamTakePage({ examId }: { examId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt") ?? "";
  const student = getStudentSession() ?? { id: "", name: "Student", email: "" };

  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const proctorRef = useRef<ReturnType<typeof useExamProctor> | null>(null);

  const submit = useCallback(async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    proctorRef.current?.markSubmitting();
    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
    const proctorPayload = proctorRef.current?.getProctoringPayload() ?? {};
    try {
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          answers,
          timeTakenSeconds,
          ...proctorPayload,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const qs = new URLSearchParams({ attempt: attemptId });
      if (searchParams.get("courseId")) qs.set("courseId", searchParams.get("courseId")!);
      if (searchParams.get("lessonId")) qs.set("lessonId", searchParams.get("lessonId")!);
      router.push(`/exams/${examId}/result/${attemptId}?${qs.toString()}`);
    } catch {
      setSubmitting(false);
      alert("Submit failed. Try again.");
    }
  }, [exam, submitting, startedAt, examId, attemptId, student, answers, router]);

  const proctor = useExamProctor({
    examId,
    attemptId,
    config: {
      enabled: Boolean(exam?.enableProctoring ?? true),
      maxViolations: exam?.maxProctorViolations ?? 3,
      autoSubmit: exam?.autoSubmitOnProctorViolation ?? true,
      requireFullscreen: exam?.requireFullscreen ?? false,
    },
    onAutoSubmit: submit,
  });
  proctorRef.current = proctor;

  useEffect(() => {
    if (!attemptId) {
      setLoadError("Missing exam attempt. Please start the exam again from the intro page.");
      setLoading(false);
      return;
    }
    const s = getStudentSession();
    setLoading(true);
    setLoadError("");
    fetch(`/api/exams/${examId}/start`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s ?? {}),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          setLoadError(j.error ?? "Could not load examination.");
          return;
        }
        if (!j.data?.exam) {
          setLoadError("Exam data unavailable. Please try starting again.");
          return;
        }
        if (!j.data.exam.questionItems?.length) {
          setLoadError("This exam has no questions yet. Add questions in the admin panel.");
          return;
        }
        setExam(j.data.exam);
        setSecondsLeft(j.data.exam.durationMinutes * 60);
      })
      .catch(() => setLoadError("Network error while loading examination."))
      .finally(() => setLoading(false));
  }, [examId, attemptId]);

  useEffect(() => {
    if (exam?.requireFullscreen) proctor.enterFullscreen();
  }, [exam, proctor]);

  useEffect(() => {
    if (!exam || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [exam, secondsLeft, submit]);

  const questions = exam?.questionItems ?? [];
  const q = questions[current];
  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => a.length > 0).length,
    [answers],
  );

  const toggleAnswer = (questionId: string, optionId: string, type: string) => {
    setAnswers((prev) => {
      const cur = prev[questionId] ?? [];
      if (type === "multi_select") {
        const has = cur.includes(optionId);
        return { ...prev, [questionId]: has ? cur.filter((x) => x !== optionId) : [...cur, optionId] };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (loading || !exam || !q) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-white">
        {loadError ? (
          <>
            <p className="text-center text-red-300">{loadError}</p>
            <a
              href={`/exams/${examId}`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Back to Exam Intro
            </a>
          </>
        ) : (
          <p>Loading examination...</p>
        )}
      </div>
    );
  }

  const maxV = exam.maxProctorViolations ?? 3;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-white/60">Online Examination · Proctored</p>
            <h1 className="text-sm font-bold sm:text-base">{exam.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {exam.enableProctoring !== false && (
              <div className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
                proctor.violationCount > 0 ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70",
              )}>
                <Eye className="h-3.5 w-3.5" />
                Violations: {proctor.violationCount}/{maxV}
              </div>
            )}
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold",
              secondsLeft < 300 ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary",
            )}>
              <Clock className="h-5 w-5" />
              {formatTime(secondsLeft)}
            </div>
            {exam.requireFullscreen && !proctor.isFullscreen && (
              <button type="button" onClick={proctor.enterFullscreen} className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold">
                <Maximize className="h-3.5 w-3.5" /> Fullscreen
              </button>
            )}
            <button type="button" onClick={() => setShowConfirm(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              <Send className="h-4 w-4" /> Submit
            </button>
          </div>
        </div>
        {proctor.warning && (
          <div className="flex items-center justify-between gap-2 border-t border-red-500/30 bg-red-500/15 px-4 py-2 text-sm text-red-300">
            <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 shrink-0" />{proctor.warning}</span>
            <button type="button" onClick={proctor.dismissWarning} className="shrink-0 rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-6xl gap-4 p-4">
        <aside className="hidden w-48 shrink-0 lg:block">
          <p className="mb-2 text-xs font-bold uppercase text-white/50">Questions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((item, i) => {
              const done = (answers[item.id]?.length ?? 0) > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg text-xs font-bold",
                    current === i ? "bg-primary text-primary-foreground" : done ? "bg-emerald-500/30 text-emerald-300" : "bg-white/10 text-white/70",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-white/50">{answeredCount}/{questions.length} answered</p>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-8">
            <div className="mb-4 flex items-center justify-between text-xs text-white/50">
              <span>Question {current + 1} of {questions.length}</span>
              <span>{q.marks} mark{q.marks > 1 ? "s" : ""} · {q.type.replace("_", " ")}</span>
            </div>
            <h2 className="text-lg font-bold leading-relaxed sm:text-xl">{q.text}</h2>
            <div className="mt-6 space-y-3">
              {q.options.map((opt) => {
                const selected = (answers[q.id] ?? []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleAnswer(q.id, opt.id, q.type)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition",
                      selected ? "border-primary bg-primary/15 text-white" : "border-white/10 bg-white/5 hover:border-white/20",
                    )}
                  >
                    <span className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-white/30",
                    )}>
                      {selected ? "✓" : ""}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button type="button" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold disabled:opacity-30">
                Previous
              </button>
              {current < questions.length - 1 ? (
                <button type="button" onClick={() => setCurrent((c) => c + 1)} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold">
                  Next Question
                </button>
              ) : (
                <button type="button" onClick={() => setShowConfirm(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                  Finish & Submit
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 text-white">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold">Submit Examination?</h3>
            </div>
            <p className="mt-3 text-sm text-white/70">
              You answered {answeredCount} of {questions.length} questions. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowConfirm(false)} className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="button" disabled={submitting} onClick={submit} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
                {submitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
