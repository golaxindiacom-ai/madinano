"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ExamQuestion, QuestionType } from "@/lib/admin/types";
import { defaultQuestion } from "@/lib/exam/question-utils";
import { inputClass, labelClass, selectClass, textareaClass } from "@/components/admin/course-form-styles";
import { cn } from "@/lib/utils";

export { defaultQuestion as makeDefaultQuestion };

type Props = {
  questions: ExamQuestion[];
  onChange: (questions: ExamQuestion[]) => void;
  durationMinutes: string;
  onDurationChange: (v: string) => void;
  passingPercentage: string;
  onPassingChange: (v: string) => void;
  maxAttempts: string;
  onMaxAttemptsChange: (v: string) => void;
  showResultsInstantly?: boolean;
  onShowResultsChange?: (v: boolean) => void;
  compact?: boolean;
};

export function InlineQuizEditor({
  questions,
  onChange,
  durationMinutes,
  onDurationChange,
  passingPercentage,
  onPassingChange,
  maxAttempts,
  onMaxAttemptsChange,
  showResultsInstantly,
  onShowResultsChange,
  compact,
}: Props) {
  const updateQuestion = (id: string, patch: Partial<ExamQuestion>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const setCorrect = (qid: string, optId: string, type: QuestionType) => {
    onChange(
      questions.map((q) => {
        if (q.id !== qid) return q;
        if (type === "multi_select") {
          const has = q.correctOptionIds.includes(optId);
          return {
            ...q,
            correctOptionIds: has
              ? q.correctOptionIds.filter((x) => x !== optId)
              : [...q.correctOptionIds, optId],
          };
        }
        return { ...q, correctOptionIds: [optId] };
      }),
    );
  };

  const addQuestion = (type: QuestionType = "mcq") => {
    onChange([...questions, defaultQuestion(type, questions.length + 1)]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    onChange(questions.filter((q) => q.id !== id));
  };

  return (
    <div className={cn("space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4", compact && "p-3")}>
      <p className="text-xs font-bold uppercase tracking-wide text-primary">Quiz Settings</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Duration (min)</span>
          <input value={durationMinutes} onChange={(e) => onDurationChange(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Pass %</span>
          <input value={passingPercentage} onChange={(e) => onPassingChange(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Max Attempts</span>
          <input value={maxAttempts} onChange={(e) => onMaxAttemptsChange(e.target.value)} className={inputClass} />
        </label>
      </div>
      {onShowResultsChange && (
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={showResultsInstantly ?? true}
            onChange={(e) => onShowResultsChange(e.target.checked)}
          />
          Show instant results after submit
        </label>
      )}

      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div key={q.id} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Q{qi + 1}</span>
              <div className="flex gap-2">
                <select
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as QuestionType;
                    const fresh = defaultQuestion(type, qi + 1);
                    updateQuestion(q.id, { type, options: fresh.options, correctOptionIds: fresh.correctOptionIds });
                  }}
                  className={selectClass + " !py-1 text-xs"}
                >
                  <option value="mcq">MCQ</option>
                  <option value="true_false">True/False</option>
                  <option value="multi_select">Multi Select</option>
                </select>
                <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              placeholder="Question text..."
              className={textareaClass + " min-h-[60px] text-sm"}
            />
            <div className="mt-2 space-y-1.5">
              {q.options.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type={q.type === "multi_select" ? "checkbox" : "radio"}
                    name={`correct-${q.id}`}
                    checked={q.correctOptionIds.includes(opt.id)}
                    onChange={() => setCorrect(q.id, opt.id, q.type)}
                  />
                  <input
                    value={opt.text}
                    onChange={(e) =>
                      updateQuestion(q.id, {
                        options: q.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)),
                      })
                    }
                    className={inputClass + " flex-1 !py-1.5 text-sm"}
                  />
                </label>
              ))}
            </div>
            <label className="mt-2 block">
              <span className={labelClass}>Marks</span>
              <input
                type="number"
                min={1}
                value={q.marks}
                onChange={(e) => updateQuestion(q.id, { marks: Number(e.target.value) || 1 })}
                className={inputClass + " w-24"}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => addQuestion("mcq")} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" /> MCQ
        </button>
        <button type="button" onClick={() => addQuestion("true_false")} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
          + True/False
        </button>
      </div>
    </div>
  );
}
