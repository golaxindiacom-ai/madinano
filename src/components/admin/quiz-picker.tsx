"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ClipboardList, ExternalLink, RefreshCw } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import type { Quiz, QuizKind } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  onChange: (quizId: string, quiz: Quiz) => void;
  kind?: QuizKind | "any";
  courseId?: string;
  instructorId?: string;
  createHref?: string;
  label?: string;
};

const KIND_LABELS: Record<string, string> = {
  lesson_quiz: "Lesson Quiz",
  final_exam: "Final Exam",
};

export function QuizPicker({
  value,
  onChange,
  kind = "any",
  courseId,
  instructorId,
  createHref = "/admin/quizzes/new",
  label = "Select Quiz",
}: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ available: "true" });
    if (kind !== "any") params.set("kind", kind);
    if (courseId) params.set("courseId", courseId);
    if (instructorId) params.set("instructorId", instructorId);

    adminFetch<Quiz[]>(`/api/admin/quizzes/library?${params}`)
      .then(setQuizzes)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [kind, courseId, instructorId]);

  const selected = quizzes.find((q) => q.id === value);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">{label}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link href={createHref} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <ExternalLink className="h-3.5 w-3.5" /> Create New Quiz
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-semibold text-ink">No quizzes found</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a quiz first, then select it here.</p>
          <Link href={createHref} className="mt-3 inline-block text-xs font-semibold text-primary">Create Quiz →</Link>
        </div>
      ) : (
        <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
          {quizzes.map((q) => {
            const active = value === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onChange(q.id, q)}
                className={cn(
                  "relative rounded-lg border p-3 text-left transition",
                  active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40",
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <p className="line-clamp-1 pr-6 text-sm font-semibold text-ink">{q.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {q.questions} questions · {q.durationMinutes} min · Pass {q.passingPercentage}%
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {q.quizKind && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      {KIND_LABELS[q.quizKind] ?? q.quizKind}
                    </span>
                  )}
                  {q.courseTitle && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {q.courseTitle}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <span className="font-semibold text-ink">Selected:</span>{" "}
          <span className="text-muted-foreground">{selected.title}</span>
          {" · "}
          <span className="text-muted-foreground">{selected.questions} questions</span>
        </div>
      )}
    </div>
  );
}
