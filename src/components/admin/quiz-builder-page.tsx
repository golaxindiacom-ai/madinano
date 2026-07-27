"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Save, Trash2, CheckCircle2, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { defaultQuestion, newId } from "@/lib/exam/question-utils";
import { importRowToExamQuestion, parseQuestionsCsv, parseQuestionsJson } from "@/lib/admin/question-import";
import type { CertificateTemplateId, ExamQuestion, QuestionType, Quiz, QuizBuilderInput, QuizKind } from "@/lib/admin/types";

type CourseOption = { id: string; title: string; instructorId: string };
import { cardClass, inputClass, labelClass, selectClass, textareaClass, helperClass, sectionTitleClass } from "@/components/admin/course-form-styles";
import { CertificateTemplatePicker } from "@/components/exam/certificate-template-picker";
import { CERTIFICATE_TEMPLATES } from "@/components/exam/certificate-templates";
import { cn } from "@/lib/utils";

const STEPS = ["basic", "settings", "questions", "review"] as const;
type Step = (typeof STEPS)[number];

type QState = ExamQuestion;

export function QuizBuilderPage({
  quizId,
  instructorId,
  basePath = "/admin/quizzes",
}: {
  quizId?: string;
  instructorId?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(quizId);
  const [step, setStep] = useState<Step>("basic");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [quizKind, setQuizKind] = useState<QuizKind | "">("");
  const [instructions, setInstructions] = useState("Read all questions carefully. Do not refresh during the exam.");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [passingPercentage, setPassingPercentage] = useState("60");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showResultsInstantly, setShowResultsInstantly] = useState(true);
  const [issueCertificateOnPass, setIssueCertificateOnPass] = useState(true);
  const [certificateTemplate, setCertificateTemplate] = useState<CertificateTemplateId>("classic-maroon");
  const [enableProctoring, setEnableProctoring] = useState(true);
  const [maxProctorViolations, setMaxProctorViolations] = useState("3");
  const [autoSubmitOnProctorViolation, setAutoSubmitOnProctorViolation] = useState(true);
  const [requireFullscreen, setRequireFullscreen] = useState(false);
  const [status, setStatus] = useState<"active" | "draft" | "inactive">("draft");
  const [questions, setQuestions] = useState<QState[]>([defaultQuestion("mcq", 1)]);

  useEffect(() => {
    adminFetch<CourseOption[]>("/api/admin/quizzes?courses=true").then((all) => {
      if (instructorId) setCourses(all.filter((c) => c.instructorId === instructorId));
      else setCourses(all);
    });
  }, [instructorId]);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    adminFetch<Quiz>(`/api/admin/quizzes/full/${quizId}`)
      .then((q) => {
        setTitle(q.title);
        setDescription(q.description ?? "");
        setCourseId(q.courseId ?? "");
        setQuizKind(q.quizKind ?? "");
        setInstructions(q.instructions ?? "");
        setDurationMinutes(String(q.durationMinutes));
        setPassingPercentage(String(q.passingPercentage));
        setMaxAttempts(String(q.maxAttempts));
        setShuffleQuestions(q.shuffleQuestions);
        setShuffleOptions(q.shuffleOptions);
        setShowResultsInstantly(q.showResultsInstantly);
        setIssueCertificateOnPass(q.issueCertificateOnPass);
        setCertificateTemplate(q.certificateTemplate ?? "classic-maroon");
        setEnableProctoring(q.enableProctoring ?? true);
        setMaxProctorViolations(String(q.maxProctorViolations ?? 3));
        setAutoSubmitOnProctorViolation(q.autoSubmitOnProctorViolation ?? true);
        setRequireFullscreen(q.requireFullscreen ?? false);
        setStatus(q.status);
        setQuestions(q.questionItems.length ? q.questionItems : [defaultQuestion()]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  const payload = (): QuizBuilderInput => ({
    title: title.trim(),
    description: description.trim() || undefined,
    courseId: courseId || undefined,
    instructorId,
    quizKind: quizKind || undefined,
    instructions: instructions.trim() || undefined,
    durationMinutes: Number(durationMinutes) || 30,
    passingPercentage: Number(passingPercentage) || 60,
    maxAttempts: Number(maxAttempts) || 3,
    shuffleQuestions,
    shuffleOptions,
    showResultsInstantly,
    issueCertificateOnPass,
    certificateTemplate,
    enableProctoring,
    maxProctorViolations: Number(maxProctorViolations) || 3,
    autoSubmitOnProctorViolation,
    requireFullscreen,
    status,
    questionItems: questions.map((q, i) => ({ ...q, order: i + 1 })),
  });

  const save = async () => {
    if (!title.trim()) { setError("Title required"); setStep("basic"); return; }
    if (questions.some((q) => !q.text.trim())) { setError("All questions need text"); setStep("questions"); return; }
    setSaving(true);
    setError("");
    try {
      const body = payload();
      if (isEdit && quizId) {
        await adminFetch(`/api/admin/quizzes/full/${quizId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminFetch("/api/admin/quizzes/full", { method: "POST", body: JSON.stringify(body) });
      }
      router.push(basePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = (type: QuestionType = "mcq") => {
    setQuestions((qs) => [...qs, defaultQuestion(type, qs.length + 1)]);
  };

  const updateQuestion = (id: string, patch: Partial<QState>) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const setCorrect = (qid: string, optId: string, type: QuestionType) => {
    setQuestions((qs) =>
      qs.map((q) => {
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

  const importFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const rows = file.name.endsWith(".csv") ? parseQuestionsCsv(text) : parseQuestionsJson(text);
        const imported = rows.map((row, i) => importRowToExamQuestion(row, questions.length + i + 1));
        setQuestions((qs) => [...qs.filter((q) => q.text.trim()), ...imported]);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading exam builder...</p>;

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link href={basePath} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Quizzes
      </Link>
      <h1 className="text-2xl font-extrabold text-ink">{isEdit ? "Edit Quiz / Exam" : "Create Quiz / Exam"}</h1>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
              step === s ? "bg-primary text-primary-foreground" : i < stepIdx ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {step === "basic" && (
        <div className={cardClass + " space-y-4"}>
          <h2 className={sectionTitleClass}>Exam Information</h2>
          <label className="block"><span className={labelClass}>Exam Title *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Final Examination" />
          </label>
          <label className="block"><span className={labelClass}>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} />
          </label>
          <label className="block"><span className={labelClass}>Quiz Type</span>
            <select value={quizKind} onChange={(e) => setQuizKind(e.target.value as QuizKind | "")} className={selectClass}>
              <option value="">General (assign later in course)</option>
              <option value="lesson_quiz">Lesson Quiz</option>
              <option value="final_exam">Final Exam</option>
            </select>
            <p className={helperClass}>Create quiz first, then add to course curriculum from course builder.</p>
          </label>
          <label className="block"><span className={labelClass}>Course (optional)</span>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={selectClass}>
              <option value="">No course — add later from course builder</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <label className="block"><span className={labelClass}>Instructions for students</span>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className={textareaClass} />
          </label>
        </div>
      )}

      {step === "settings" && (
        <div className={cardClass + " space-y-4"}>
          <h2 className={sectionTitleClass}>Exam Settings</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block"><span className={labelClass}>Duration (minutes)</span>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Passing %</span>
              <input type="number" min={1} max={100} value={passingPercentage} onChange={(e) => setPassingPercentage(e.target.value)} className={inputClass} />
            </label>
            <label className="block"><span className={labelClass}>Max Attempts</span>
              <input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block"><span className={labelClass}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass}>
              <option value="draft">Draft</option>
              <option value="active">Active (Live)</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [shuffleQuestions, setShuffleQuestions, "Shuffle questions"],
              [shuffleOptions, setShuffleOptions, "Shuffle options"],
              [showResultsInstantly, setShowResultsInstantly, "Show instant results"],
              [issueCertificateOnPass, setIssueCertificateOnPass, "Issue certificate on pass (with QR)"],
              [enableProctoring, setEnableProctoring, "Enable proctoring (tab switch detect)"],
              [autoSubmitOnProctorViolation, setAutoSubmitOnProctorViolation, "Auto-submit on max violations"],
              [requireFullscreen, setRequireFullscreen, "Require fullscreen mode"],
            ].map(([val, set, label]) => (
              <label key={String(label)} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <input type="checkbox" checked={val as boolean} onChange={(e) => (set as (v: boolean) => void)(e.target.checked)} />
                <span className="text-sm font-semibold">{label as string}</span>
              </label>
            ))}
          </div>
          {enableProctoring && (
            <label className="block max-w-xs"><span className={labelClass}>Max tab-switch violations</span>
              <input type="number" min={1} max={10} value={maxProctorViolations} onChange={(e) => setMaxProctorViolations(e.target.value)} className={inputClass} />
            </label>
          )}

          {issueCertificateOnPass && (
            <div className="border-t border-border pt-4">
              <p className={labelClass}>Certificate Template</p>
              <p className={helperClass}>Choose the design students receive on passing. Each includes director signature, QR verification & certificate number.</p>
              <div className="mt-3">
                <CertificateTemplatePicker value={certificateTemplate} onChange={setCertificateTemplate} />
              </div>
            </div>
          )}
        </div>
      )}

      {step === "questions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addQuestion("mcq")} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="mr-1 inline h-3.5 w-3.5" />MCQ</button>
            <button type="button" onClick={() => addQuestion("true_false")} className="rounded-lg border px-3 py-2 text-xs font-semibold">True/False</button>
            <button type="button" onClick={() => addQuestion("multi_select")} className="rounded-lg border px-3 py-2 text-xs font-semibold">Multi Select</button>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
              <Upload className="h-3.5 w-3.5" /> Import JSON/CSV
              <input type="file" accept=".json,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
            </label>
          </div>
          {questions.map((q, idx) => (
            <div key={q.id} className={cardClass + " space-y-3"}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted-foreground">Q{idx + 1} · {q.type.replace("_", " ")}</span>
                {questions.length > 1 && (
                  <button type="button" onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
              <textarea value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="Question text *" className={textareaClass + " min-h-[70px]"} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className={labelClass}>Marks</span>
                  <input type="number" min={1} value={q.marks} onChange={(e) => updateQuestion(q.id, { marks: Number(e.target.value) })} className={inputClass} />
                </label>
                <label className="block"><span className={labelClass}>Negative marks (optional)</span>
                  <input type="number" min={0} value={q.negativeMarks ?? ""} onChange={(e) => updateQuestion(q.id, { negativeMarks: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} />
                </label>
              </div>
              <p className={helperClass}>Click option to mark as correct{q.type === "multi_select" ? " (multiple allowed)" : ""}</p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isCorrect = q.correctOptionIds.includes(opt.id);
                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrect(q.id, opt.id, q.type)}
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
                          isCorrect ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                      >
                        {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      </button>
                      <input
                        value={opt.text}
                        onChange={(e) =>
                          updateQuestion(q.id, {
                            options: q.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)),
                          })
                        }
                        className={inputClass + " mt-0"}
                      />
                    </div>
                  );
                })}
              </div>
              <input value={q.explanation ?? ""} onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })} placeholder="Explanation (shown after submit)" className={inputClass} />
            </div>
          ))}
        </div>
      )}

      {step === "review" && (
        <div className={cardClass + " space-y-2 text-sm"}>
          <p><strong>Title:</strong> {title}</p>
          <p><strong>Questions:</strong> {questions.length} · <strong>Total marks:</strong> {questions.reduce((s, q) => s + q.marks, 0)}</p>
          <p><strong>Duration:</strong> {durationMinutes} min · <strong>Pass:</strong> {passingPercentage}%</p>
          <p><strong>Certificate on pass:</strong> {issueCertificateOnPass ? `Yes · ${CERTIFICATE_TEMPLATES.find((t) => t.id === certificateTemplate)?.name ?? "Classic Maroon"} template (QR + no. + PDF)` : "No"}</p>
          <p><strong>Proctoring:</strong> {enableProctoring ? `On (max ${maxProctorViolations} violations)` : "Off"}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" disabled={stepIdx === 0} onClick={() => setStep(STEPS[stepIdx - 1])} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40">
          <ArrowLeft className="mr-1 inline h-4 w-4" />Previous
        </button>
        {step !== "review" ? (
          <button type="button" onClick={() => setStep(STEPS[stepIdx + 1])} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Next<ArrowRight className="ml-1 inline h-4 w-4" />
          </button>
        ) : (
          <button type="button" disabled={saving} onClick={save} className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            <Save className="mr-1 inline h-4 w-4" />{saving ? "Saving..." : isEdit ? "Update Exam" : "Publish Exam"}
          </button>
        )}
      </div>
    </div>
  );
}
