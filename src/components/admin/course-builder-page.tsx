"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Save,
  Trash2,
  Video,
  Youtube,
  MonitorPlay,
  ClipboardList,
  Award,
} from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { youtubeEmbedUrl, youtubeThumbnail, parseYoutubeVideoId } from "@/lib/admin/youtube";
import type {
  Category,
  CertificateTemplateId,
  CourseBuilderInput,
  CourseFullPayload,
  CourseMode,
  ExamQuestion,
  Instructor,
  LessonType,
  LiveClassPlatform,
  Quiz,
} from "@/lib/admin/types";
import { InlineQuizEditor, makeDefaultQuestion } from "@/components/admin/inline-quiz-editor";
import { QuizPicker } from "@/components/admin/quiz-picker";
import { CertificateTemplatePicker } from "@/components/exam/certificate-template-picker";
import {
  cardClass,
  helperClass,
  inputClass,
  labelClass,
  sectionTitleClass,
  selectClass,
  textareaClass,
} from "@/components/admin/course-form-styles";
import { discountPercent, resolveCourseCategoryIds } from "@/lib/admin/categories";
import { CategoryCascadeSelect } from "@/components/admin/category-cascade-select";
import { cn } from "@/lib/utils";

type BuilderSection = { id: string; title: string; description: string; order: number };

type LessonQuizState = {
  quizId?: string;
  durationMinutes: string;
  passingPercentage: string;
  maxAttempts: string;
  showResultsInstantly: boolean;
  questions: ExamQuestion[];
};

type BuilderLesson = {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  status: "published" | "draft";
  lessonType: LessonType;
  content: string;
  videoUrl: string;
  isPrivateVideo: boolean;
  quizMode: "select" | "inline";
  quizId?: string;
  quiz?: LessonQuizState;
};

type FinalExamState = {
  enabled: boolean;
  quizMode: "select" | "inline";
  quizId?: string;
  title: string;
  description: string;
  instructions: string;
  durationMinutes: string;
  passingPercentage: string;
  maxAttempts: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsInstantly: boolean;
  issueCertificateOnPass: boolean;
  certificateTemplate: CertificateTemplateId;
  enableProctoring: boolean;
  maxProctorViolations: string;
  autoSubmitOnProctorViolation: boolean;
  requireFullscreen: boolean;
  questions: ExamQuestion[];
};

type BuilderLiveClass = {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: string;
  platform: LiveClassPlatform;
  meetingUrl: string;
  meetingId: string;
  passcode: string;
  youtubeLiveUrl: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
};

type BuilderState = {
  title: string;
  shortDescription: string;
  description: string;
  mainCategoryId: string;
  subCategoryId: string;
  subSubCategoryId: string;
  instructorId: string;
  originalPrice: string;
  sellingPrice: string;
  duration: string;
  mode: CourseMode;
  level: "beginner" | "intermediate" | "advanced";
  status: "published" | "draft" | "archived";
  language: string;
  requirements: string;
  outcomes: string;
  thumbnailUrl: string;
  curriculum: BuilderSection[];
  lessons: BuilderLesson[];
  liveClasses: BuilderLiveClass[];
  finalExam: FinalExamState;
};

const STEPS = [
  { id: "basic", label: "Basic Info" },
  { id: "details", label: "Course Details" },
  { id: "curriculum", label: "Curriculum" },
  { id: "lessons", label: "Lessons" },
  { id: "live", label: "Live Classes" },
  { id: "exams", label: "Final Exam" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function uid() {
  return crypto.randomUUID();
}

function emptyLessonQuiz(): LessonQuizState {
  return {
    durationMinutes: "10",
    passingPercentage: "60",
    maxAttempts: "5",
    showResultsInstantly: true,
    questions: [makeDefaultQuestion()],
  };
}

function emptyFinalExam(): FinalExamState {
  return {
    enabled: false,
    quizMode: "select",
    title: "",
    description: "",
    instructions: "Read all questions carefully. Do not switch tabs during the final exam.",
    durationMinutes: "45",
    passingPercentage: "60",
    maxAttempts: "3",
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultsInstantly: true,
    issueCertificateOnPass: true,
    certificateTemplate: "classic-maroon",
    enableProctoring: true,
    maxProctorViolations: "3",
    autoSubmitOnProctorViolation: true,
    requireFullscreen: false,
    questions: [makeDefaultQuestion()],
  };
}

function quizFromDb(quiz: Quiz): LessonQuizState {
  return {
    quizId: quiz.id,
    durationMinutes: String(quiz.durationMinutes),
    passingPercentage: String(quiz.passingPercentage),
    maxAttempts: String(quiz.maxAttempts),
    showResultsInstantly: quiz.showResultsInstantly,
    questions: quiz.questionItems.length ? quiz.questionItems : [makeDefaultQuestion()],
  };
}

function emptyState(): BuilderState {
  const sectionId = uid();
  return {
    title: "",
    shortDescription: "",
    description: "",
    mainCategoryId: "",
    subCategoryId: "",
    subSubCategoryId: "",
    instructorId: "",
    originalPrice: "",
    sellingPrice: "",
    duration: "",
    mode: "recorded",
    level: "beginner",
    status: "draft",
    language: "English",
    requirements: "",
    outcomes: "",
    thumbnailUrl: "",
    curriculum: [{ id: sectionId, title: "Introduction", description: "", order: 1 }],
    lessons: [],
    liveClasses: [],
    finalExam: emptyFinalExam(),
  };
}

function payloadFromState(state: BuilderState): CourseBuilderInput {
  const categoryIds = resolveCourseCategoryIds(
    state.mainCategoryId,
    state.subCategoryId || undefined,
    state.subSubCategoryId || undefined,
  );

  return {
    title: state.title.trim(),
    shortDescription: state.shortDescription.trim() || undefined,
    description: state.description.trim(),
    ...categoryIds,
    instructorId: state.instructorId,
    originalPrice: Number(state.originalPrice) || 0,
    sellingPrice: Number(state.sellingPrice) || 0,
    level: state.level,
    status: state.status,
    mode: state.mode,
    duration: state.duration.trim(),
    language: state.language.trim() || undefined,
    requirements: state.requirements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    outcomes: state.outcomes
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    thumbnailUrl: state.thumbnailUrl.trim() || undefined,
    curriculum: state.curriculum.map((s, i) => ({
      id: s.id,
      title: s.title,
      description: s.description || undefined,
      order: i + 1,
    })),
    lessons: state.lessons.map((l, i) => ({
      id: l.id.startsWith("new-") ? undefined : l.id,
      sectionId: l.sectionId,
      title: l.title,
      description: l.description || undefined,
      duration: l.duration,
      order: i + 1,
      status: l.status,
      lessonType: l.lessonType,
      content: l.content || undefined,
      videoProvider: l.lessonType === "video" ? "youtube" : undefined,
      videoUrl: l.lessonType === "video" ? l.videoUrl : undefined,
      isPrivateVideo: l.isPrivateVideo,
      quizId: l.quizId,
      quiz:
        l.lessonType === "quiz" && l.quizMode === "inline" && l.quiz
          ? {
              id: l.quiz.quizId,
              durationMinutes: Number(l.quiz.durationMinutes) || 10,
              passingPercentage: Number(l.quiz.passingPercentage) || 60,
              maxAttempts: Number(l.quiz.maxAttempts) || 5,
              showResultsInstantly: l.quiz.showResultsInstantly,
              questionItems: l.quiz.questions.map((q, qi) => ({ ...q, order: qi + 1 })),
            }
          : undefined,
    })),
    liveClasses: state.liveClasses.map((l) => ({
      id: l.id.startsWith("new-") ? undefined : l.id,
      sectionId: l.sectionId || undefined,
      title: l.title,
      description: l.description || undefined,
      scheduledAt: l.scheduledAt,
      duration: l.duration,
      platform: l.platform,
      meetingUrl: l.meetingUrl || undefined,
      meetingId: l.meetingId || undefined,
      passcode: l.passcode || undefined,
      youtubeLiveUrl: l.youtubeLiveUrl || undefined,
      status: l.status,
    })),
    finalExam: state.finalExam.enabled
      ? {
          enabled: true,
          quizId: state.finalExam.quizId,
          title: state.finalExam.quizMode === "inline" ? state.finalExam.title.trim() || undefined : undefined,
          description: state.finalExam.quizMode === "inline" ? state.finalExam.description.trim() || undefined : undefined,
          instructions: state.finalExam.quizMode === "inline" ? state.finalExam.instructions.trim() || undefined : undefined,
          durationMinutes: state.finalExam.quizMode === "inline" ? Number(state.finalExam.durationMinutes) || 45 : 45,
          passingPercentage: state.finalExam.quizMode === "inline" ? Number(state.finalExam.passingPercentage) || 60 : 60,
          maxAttempts: state.finalExam.quizMode === "inline" ? Number(state.finalExam.maxAttempts) || 3 : 3,
          shuffleQuestions: state.finalExam.shuffleQuestions,
          shuffleOptions: state.finalExam.shuffleOptions,
          showResultsInstantly: state.finalExam.showResultsInstantly,
          issueCertificateOnPass: state.finalExam.issueCertificateOnPass,
          certificateTemplate: state.finalExam.certificateTemplate,
          enableProctoring: state.finalExam.enableProctoring,
          maxProctorViolations: Number(state.finalExam.maxProctorViolations) || 3,
          autoSubmitOnProctorViolation: state.finalExam.autoSubmitOnProctorViolation,
          requireFullscreen: state.finalExam.requireFullscreen,
          questionItems:
            state.finalExam.quizMode === "inline"
              ? state.finalExam.questions.map((q, i) => ({ ...q, order: i + 1 }))
              : [],
        }
      : {
          enabled: false,
          durationMinutes: 45,
          passingPercentage: 60,
          maxAttempts: 3,
          shuffleQuestions: true,
          shuffleOptions: true,
          showResultsInstantly: true,
          issueCertificateOnPass: true,
          certificateTemplate: state.finalExam.certificateTemplate,
          enableProctoring: true,
          maxProctorViolations: 3,
          autoSubmitOnProctorViolation: true,
          requireFullscreen: false,
          questionItems: [],
        },
  };
}

function stateFromFull(data: CourseFullPayload): BuilderState {
  return {
    title: data.course.title,
    shortDescription: data.course.shortDescription ?? "",
    description: data.course.description,
    mainCategoryId: data.course.mainCategoryId ?? data.course.categoryId,
    subCategoryId: data.course.subCategoryId ?? "",
    subSubCategoryId: data.course.subSubCategoryId ?? "",
    instructorId: data.course.instructorId,
    originalPrice: String(data.course.originalPrice ?? data.course.price ?? 0),
    sellingPrice: String(data.course.sellingPrice ?? data.course.price ?? 0),
    duration: data.course.duration,
    mode: data.course.mode,
    level: data.course.level,
    status: data.course.status,
    language: data.course.language ?? "English",
    requirements: (data.course.requirements ?? []).join("\n"),
    outcomes: (data.course.outcomes ?? []).join("\n"),
    thumbnailUrl: data.course.thumbnailUrl ?? "",
    curriculum:
      data.course.curriculum.length > 0
        ? data.course.curriculum.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description ?? "",
            order: s.order,
          }))
        : [{ id: uid(), title: "Introduction", description: "", order: 1 }],
    lessons: data.lessons.map((l) => ({
      id: l.id,
      sectionId: l.sectionId,
      title: l.title,
      description: l.description ?? "",
      duration: l.duration,
      order: l.order,
      status: l.status,
      lessonType: l.lessonType,
      content: l.content ?? "",
      videoUrl: l.videoUrl ?? "",
      isPrivateVideo: l.isPrivateVideo ?? false,
      quizMode: l.lessonType === "quiz" && l.quizId ? "select" : "inline",
      quizId: l.quizId,
      quiz:
        l.lessonType === "quiz" && data.lessonQuizzes[l.id]
          ? quizFromDb(data.lessonQuizzes[l.id])
          : l.lessonType === "quiz"
            ? emptyLessonQuiz()
            : undefined,
    })),
    liveClasses: data.liveClasses.map((l) => ({
      id: l.id,
      sectionId: l.sectionId ?? "",
      title: l.title,
      description: l.description ?? "",
      scheduledAt: l.scheduledAt.slice(0, 16),
      duration: l.duration,
      platform: l.platform,
      meetingUrl: l.meetingUrl ?? "",
      meetingId: l.meetingId ?? "",
      passcode: l.passcode ?? "",
      youtubeLiveUrl: l.youtubeLiveUrl ?? "",
      status: l.status,
    })),
    finalExam: data.finalExam
      ? {
          enabled: true,
          quizMode: "select",
          quizId: data.finalExam.id,
          title: data.finalExam.title,
          description: data.finalExam.description ?? "",
          instructions: data.finalExam.instructions ?? "",
          durationMinutes: String(data.finalExam.durationMinutes),
          passingPercentage: String(data.finalExam.passingPercentage),
          maxAttempts: String(data.finalExam.maxAttempts),
          shuffleQuestions: data.finalExam.shuffleQuestions,
          shuffleOptions: data.finalExam.shuffleOptions,
          showResultsInstantly: data.finalExam.showResultsInstantly,
          issueCertificateOnPass: data.finalExam.issueCertificateOnPass,
          certificateTemplate: data.finalExam.certificateTemplate ?? "classic-maroon",
          enableProctoring: data.finalExam.enableProctoring,
          maxProctorViolations: String(data.finalExam.maxProctorViolations),
          autoSubmitOnProctorViolation: data.finalExam.autoSubmitOnProctorViolation,
          requireFullscreen: data.finalExam.requireFullscreen,
          questions: data.finalExam.questionItems.length
            ? data.finalExam.questionItems
            : [makeDefaultQuestion()],
        }
      : emptyFinalExam(),
  };
}

export function CourseBuilderPage({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(courseId);
  const [step, setStep] = useState<StepId>("basic");
  const [state, setState] = useState<BuilderState>(emptyState);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch<{ categories: Category[] }>("/api/admin/categories/tree"),
      adminFetch<Instructor[]>("/api/admin/instructors?status=active"),
    ]).then(([catData, insts]) => {
      setCategories(catData.categories);
      setInstructors(insts);
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    adminFetch<CourseFullPayload>(`/api/admin/courses/full/${courseId}`)
      .then((data) => setState(stateFromFull(data)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load course"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const showLiveStep = state.mode === "live" || state.mode === "hybrid";

  const visibleSteps = useMemo(
    () => STEPS.filter((s) => s.id !== "live" || showLiveStep),
    [showLiveStep],
  );

  const stepIndex = visibleSteps.findIndex((s) => s.id === step);

  const validateStep = (current: StepId): string | null => {
    if (current === "basic") {
      if (!state.title.trim()) return "Course title is required";
      if (!state.description.trim()) return "Course description is required";
      if (!state.mainCategoryId) return "Select a main category";
      if (!state.instructorId) return "Select an instructor";
    }
    if (current === "details") {
      if (!state.duration.trim()) return "Course duration is required";
      if (state.sellingPrice === "" || Number(state.sellingPrice) < 0) return "Valid selling price is required";
      if (state.originalPrice !== "" && Number(state.originalPrice) < Number(state.sellingPrice)) {
        return "Original price (MRP) must be greater than or equal to selling price";
      }
    }
    if (current === "curriculum") {
      if (state.curriculum.length === 0) return "Add at least one curriculum section";
      if (state.curriculum.some((s) => !s.title.trim())) return "All sections need a title";
    }
    if (current === "lessons" && (state.mode === "recorded" || state.mode === "hybrid")) {
      if (state.lessons.length === 0) return "Add at least one lesson for recorded content";
      const badQuiz = state.lessons.find(
        (l) =>
          l.lessonType === "quiz" &&
          ((l.quizMode === "select" && !l.quizId) ||
            (l.quizMode === "inline" && (!l.quiz || !l.quiz.questions.some((q) => q.text.trim())))),
      );
      if (badQuiz) {
        return badQuiz.quizMode === "select"
          ? `Lesson "${badQuiz.title || "Quiz"}" — select a quiz from library`
          : `Lesson "${badQuiz.title || "Quiz"}" needs at least one question with text`;
      }
    }
    if (current === "exams" && state.finalExam.enabled) {
      if (state.finalExam.quizMode === "select" && !state.finalExam.quizId) {
        return "Select a final exam from quiz library";
      }
      if (state.finalExam.quizMode === "inline" && !state.finalExam.questions.some((q) => q.text.trim())) {
        return "Final exam needs at least one question";
      }
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    const idx = visibleSteps.findIndex((s) => s.id === step);
    if (idx < visibleSteps.length - 1) setStep(visibleSteps[idx + 1].id);
  };

  const goPrev = () => {
    setError("");
    const idx = visibleSteps.findIndex((s) => s.id === step);
    if (idx > 0) setStep(visibleSteps[idx - 1].id);
  };

  const handleSave = async () => {
    for (const s of visibleSteps) {
      const err = validateStep(s.id);
      if (err) {
        setError(err);
        setStep(s.id);
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const payload = payloadFromState(state);
      if (isEdit && courseId) {
        await adminFetch(`/api/admin/courses/full/${courseId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/api/admin/courses/full", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/admin/courses");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setState((s) => ({
      ...s,
      curriculum: [
        ...s.curriculum,
        { id: uid(), title: `Section ${s.curriculum.length + 1}`, description: "", order: s.curriculum.length + 1 },
      ],
    }));
  };

  const addLesson = (sectionId: string) => {
    const id = `new-${uid()}`;
    setState((s) => ({
      ...s,
      lessons: [
        ...s.lessons,
        {
          id,
          sectionId,
          title: "",
          description: "",
          duration: "10m",
          order: s.lessons.length + 1,
          status: "draft" as const,
          lessonType: "video" as const,
          content: "",
          videoUrl: "",
          isPrivateVideo: false,
          quizMode: "select" as const,
        },
      ],
    }));
    setExpandedLesson(id);
  };

  const addLiveClass = () => {
    setState((s) => ({
      ...s,
      liveClasses: [
        ...s.liveClasses,
        {
          id: `new-${uid()}`,
          sectionId: s.curriculum[0]?.id ?? "",
          title: "",
          description: "",
          scheduledAt: "",
          duration: "1h",
          platform: "google_meet" as LiveClassPlatform,
          meetingUrl: "",
          meetingId: "",
          passcode: "",
          youtubeLiveUrl: "",
          status: "scheduled" as const,
        },
      ],
    }));
  };

  const update = useCallback(<K extends keyof BuilderState>(key: K, value: BuilderState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading course builder...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/courses" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Link>
          <h1 className="text-2xl font-extrabold text-ink">{isEdit ? "Edit Course" : "Add New Course"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your course with curriculum, recorded lessons & live sessions
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex flex-wrap gap-2">
        {visibleSteps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setError("");
              setStep(s.id);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              step === s.id
                ? "bg-primary text-primary-foreground"
                : i < visibleSteps.findIndex((x) => x.id === step)
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[10px]">
              {i < visibleSteps.findIndex((x) => x.id === step) ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: Basic Info */}
      {step === "basic" && (
        <div className={cardClass + " space-y-5"}>
          <h2 className={sectionTitleClass}>Basic Information</h2>
          <label className="block">
            <span className={labelClass}>Course Title *</span>
            <input
              value={state.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. UPSC Civil Services Foundation"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Short Description</span>
            <input
              value={state.shortDescription}
              onChange={(e) => update("shortDescription", e.target.value)}
              placeholder="One-line summary for course cards"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Course Description *</span>
            <textarea
              value={state.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Detailed description of what students will learn..."
              className={textareaClass}
            />
          </label>
          <CategoryCascadeSelect
            categories={categories}
            mainCategoryId={state.mainCategoryId}
            subCategoryId={state.subCategoryId}
            subSubCategoryId={state.subSubCategoryId}
            onMainChange={(id) =>
              setState((s) => ({ ...s, mainCategoryId: id, subCategoryId: "", subSubCategoryId: "" }))
            }
            onSubChange={(id) =>
              setState((s) => ({ ...s, subCategoryId: id, subSubCategoryId: "" }))
            }
            onSubSubChange={(id) => setState((s) => ({ ...s, subSubCategoryId: id }))}
          />
          <label className="block">
            <span className={labelClass}>Instructor *</span>
            <select value={state.instructorId} onChange={(e) => update("instructorId", e.target.value)} className={selectClass}>
              <option value="">Select instructor</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Thumbnail URL</span>
            <input
              value={state.thumbnailUrl}
              onChange={(e) => update("thumbnailUrl", e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </label>
        </div>
      )}

      {/* Step 2: Details */}
      {step === "details" && (
        <div className={cardClass + " space-y-5"}>
          <h2 className={sectionTitleClass}>Course Details</h2>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="text-sm font-bold text-ink">Pricing</h3>
            <p className={helperClass}>Set MRP (original price) and selling price — discount auto-calculated</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={labelClass}>Original Price / MRP (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={state.originalPrice}
                  onChange={(e) => update("originalPrice", e.target.value)}
                  placeholder="1999"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Selling Price (₹) *</span>
                <input
                  type="number"
                  min={0}
                  value={state.sellingPrice}
                  onChange={(e) => update("sellingPrice", e.target.value)}
                  placeholder="499"
                  className={inputClass}
                />
              </label>
              <div className="flex flex-col justify-end">
                <span className={labelClass}>Discount</span>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {discountPercent(Number(state.originalPrice) || 0, Number(state.sellingPrice) || 0)}% OFF
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Duration *</span>
              <input
                value={state.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="e.g. 12 weeks, 40 hours"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Course Mode *</span>
              <select value={state.mode} onChange={(e) => update("mode", e.target.value as CourseMode)} className={selectClass}>
                <option value="recorded">Recorded (Pre-recorded videos)</option>
                <option value="live">Live (Live classes only)</option>
                <option value="hybrid">Hybrid (Recorded + Live)</option>
              </select>
              <p className={helperClass}>
                Recorded courses use YouTube videos in lessons. Live/Hybrid adds Meet, Zoom or YouTube Live sessions.
              </p>
            </label>
            <label className="block">
              <span className={labelClass}>Level</span>
              <select value={state.level} onChange={(e) => update("level", e.target.value as BuilderState["level"])} className={selectClass}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Language</span>
              <input value={state.language} onChange={(e) => update("language", e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Status</span>
              <select value={state.status} onChange={(e) => update("status", e.target.value as BuilderState["status"])} className={selectClass}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Requirements (one per line)</span>
            <textarea
              value={state.requirements}
              onChange={(e) => update("requirements", e.target.value)}
              placeholder="Basic computer knowledge&#10;Internet connection"
              className={textareaClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Learning Outcomes (one per line)</span>
            <textarea
              value={state.outcomes}
              onChange={(e) => update("outcomes", e.target.value)}
              placeholder="Build real-world projects&#10;Master HTML, CSS & JavaScript"
              className={textareaClass}
            />
          </label>
        </div>
      )}

      {/* Step 3: Curriculum */}
      {step === "curriculum" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={sectionTitleClass}>Course Curriculum</h2>
            <button type="button" onClick={addSection} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
              <Plus className="h-3.5 w-3.5" /> Add Section
            </button>
          </div>
          {state.curriculum.map((section, idx) => (
            <div key={section.id} className={cardClass + " space-y-3"}>
              <div className="flex items-start gap-3">
                <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Section {idx + 1}</span>
                    {state.curriculum.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            curriculum: s.curriculum.filter((x) => x.id !== section.id),
                            lessons: s.lessons.filter((l) => l.sectionId !== section.id),
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    value={section.title}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        curriculum: s.curriculum.map((x) =>
                          x.id === section.id ? { ...x, title: e.target.value } : x,
                        ),
                      }))
                    }
                    placeholder="Section title"
                    className={inputClass}
                  />
                  <textarea
                    value={section.description}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        curriculum: s.curriculum.map((x) =>
                          x.id === section.id ? { ...x, description: e.target.value } : x,
                        ),
                      }))
                    }
                    placeholder="Section description (optional)"
                    className={textareaClass + " min-h-[80px]"}
                  />
                  <p className={helperClass}>
                    {state.lessons.filter((l) => l.sectionId === section.id).length} lesson(s) in this section
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 4: Lessons */}
      {step === "lessons" && (
        <div className="space-y-4">
          <div>
            <h2 className={sectionTitleClass}>Lesson Design</h2>
            <p className={helperClass}>
              Add recorded lessons with YouTube videos. Enable &quot;Private YouTube Video&quot; for unlisted/private links
              (ensure your domain is allowed in YouTube embed settings).
            </p>
          </div>

          {(state.mode === "live") && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This course is Live-only mode. Skip lessons or switch to Hybrid/Recorded to add video lessons.
            </div>
          )}

          {state.curriculum.map((section) => (
            <div key={section.id} className={cardClass}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-ink">{section.title}</h3>
                <button
                  type="button"
                  onClick={() => addLesson(section.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Lesson
                </button>
              </div>

              {state.lessons.filter((l) => l.sectionId === section.id).length === 0 ? (
                <p className="text-sm text-muted-foreground">No lessons yet in this section</p>
              ) : (
                <div className="space-y-3">
                  {state.lessons
                    .filter((l) => l.sectionId === section.id)
                    .map((lesson) => {
                      const videoId = parseYoutubeVideoId(lesson.videoUrl);
                      const open = expandedLesson === lesson.id;
                      return (
                        <div key={lesson.id} className="rounded-xl border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => setExpandedLesson(open ? null : lesson.id)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left"
                          >
                            <span className="flex items-center gap-2 font-semibold text-sm">
                              <Video className="h-4 w-4 text-primary" />
                              {lesson.title || "Untitled Lesson"}
                            </span>
                            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {open && (
                            <div className="space-y-4 border-t border-border px-4 py-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block sm:col-span-2">
                                  <span className={labelClass}>Lesson Title *</span>
                                  <input
                                    value={lesson.title}
                                    onChange={(e) =>
                                      setState((s) => ({
                                        ...s,
                                        lessons: s.lessons.map((l) =>
                                          l.id === lesson.id ? { ...l, title: e.target.value } : l,
                                        ),
                                      }))
                                    }
                                    className={inputClass}
                                  />
                                </label>
                                <label className="block">
                                  <span className={labelClass}>Lesson Type</span>
                                  <select
                                    value={lesson.lessonType}
                                    onChange={(e) => {
                                      const lessonType = e.target.value as LessonType;
                                      setState((s) => ({
                                        ...s,
                                        lessons: s.lessons.map((l) =>
                                          l.id === lesson.id
                                            ? {
                                                ...l,
                                                lessonType,
                                                quizMode: lessonType === "quiz" ? l.quizMode ?? "select" : "select",
                                                quiz: lessonType === "quiz" && l.quizMode === "inline" ? l.quiz ?? emptyLessonQuiz() : undefined,
                                                quizId: lessonType === "quiz" ? l.quizId : undefined,
                                              }
                                            : l,
                                        ),
                                      }));
                                    }}
                                    className={selectClass}
                                  >
                                    <option value="video">Video Lesson</option>
                                    <option value="text">Text / Reading</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="assignment">Assignment</option>
                                  </select>
                                </label>
                                <label className="block">
                                  <span className={labelClass}>Duration</span>
                                  <input
                                    value={lesson.duration}
                                    onChange={(e) =>
                                      setState((s) => ({
                                        ...s,
                                        lessons: s.lessons.map((l) =>
                                          l.id === lesson.id ? { ...l, duration: e.target.value } : l,
                                        ),
                                      }))
                                    }
                                    placeholder="45m"
                                    className={inputClass}
                                  />
                                </label>
                              </div>
                              <label className="block">
                                <span className={labelClass}>Lesson Description</span>
                                <textarea
                                  value={lesson.description}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      lessons: s.lessons.map((l) =>
                                        l.id === lesson.id ? { ...l, description: e.target.value } : l,
                                      ),
                                    }))
                                  }
                                  className={textareaClass + " min-h-[80px]"}
                                />
                              </label>

                              {lesson.lessonType === "video" && (
                                <>
                                  <label className="block">
                                    <span className={labelClass}>
                                      <Youtube className="mr-1 inline h-4 w-4" />
                                      YouTube Video URL *
                                    </span>
                                    <input
                                      value={lesson.videoUrl}
                                      onChange={(e) =>
                                        setState((s) => ({
                                          ...s,
                                          lessons: s.lessons.map((l) =>
                                            l.id === lesson.id ? { ...l, videoUrl: e.target.value } : l,
                                          ),
                                        }))
                                      }
                                      placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                                      className={inputClass}
                                    />
                                    <p className={helperClass}>
                                      Paste YouTube video link — works with public, unlisted & private videos (if embed allowed).
                                    </p>
                                  </label>
                                  <label className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={lesson.isPrivateVideo}
                                      onChange={(e) =>
                                        setState((s) => ({
                                          ...s,
                                          lessons: s.lessons.map((l) =>
                                            l.id === lesson.id ? { ...l, isPrivateVideo: e.target.checked } : l,
                                          ),
                                        }))
                                      }
                                    />
                                    <span className="text-sm font-semibold">Private / Unlisted YouTube Video</span>
                                  </label>
                                  {videoId && (
                                    <div className="overflow-hidden rounded-xl border border-border">
                                      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                                        <MonitorPlay className="h-3.5 w-3.5" /> Video Preview
                                      </div>
                                      <div className="aspect-video bg-black">
                                        <iframe
                                          src={youtubeEmbedUrl(videoId, lesson.isPrivateVideo)}
                                          title={lesson.title}
                                          className="h-full w-full"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      </div>
                                      {!lesson.isPrivateVideo && (
                                        <img src={youtubeThumbnail(videoId)} alt="" className="hidden" />
                                      )}
                                    </div>
                                  )}
                                </>
                              )}

                              {lesson.lessonType === "text" && (
                                <label className="block">
                                  <span className={labelClass}>Lesson Content</span>
                                  <textarea
                                    value={lesson.content}
                                    onChange={(e) =>
                                      setState((s) => ({
                                        ...s,
                                        lessons: s.lessons.map((l) =>
                                          l.id === lesson.id ? { ...l, content: e.target.value } : l,
                                        ),
                                      }))
                                    }
                                    className={textareaClass}
                                  />
                                </label>
                              )}

                              {lesson.lessonType === "quiz" && (
                                <div className="space-y-4">
                                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <ClipboardList className="h-4 w-4" /> Quiz Lesson
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {(["select", "inline"] as const).map((mode) => (
                                      <button
                                        key={mode}
                                        type="button"
                                        onClick={() =>
                                          setState((s) => ({
                                            ...s,
                                            lessons: s.lessons.map((l) =>
                                              l.id === lesson.id
                                                ? {
                                                    ...l,
                                                    quizMode: mode,
                                                    quiz: mode === "inline" ? l.quiz ?? emptyLessonQuiz() : undefined,
                                                  }
                                                : l,
                                            ),
                                          }))
                                        }
                                        className={cn(
                                          "rounded-lg px-3 py-1.5 text-xs font-semibold",
                                          lesson.quizMode === mode
                                            ? "bg-primary text-primary-foreground"
                                            : "border border-border text-muted-foreground",
                                        )}
                                      >
                                        {mode === "select" ? "Select from Library" : "Create Inline"}
                                      </button>
                                    ))}
                                  </div>

                                  {lesson.quizMode === "select" ? (
                                    <QuizPicker
                                      value={lesson.quizId}
                                      kind="lesson_quiz"
                                      courseId={courseId}
                                      instructorId={state.instructorId || undefined}
                                      label="Choose a quiz for this lesson"
                                      onChange={(quizId, quiz) =>
                                        setState((s) => ({
                                          ...s,
                                          lessons: s.lessons.map((l) =>
                                            l.id === lesson.id
                                              ? {
                                                  ...l,
                                                  quizId,
                                                  title: l.title.trim() ? l.title : quiz.title,
                                                }
                                              : l,
                                          ),
                                        }))
                                      }
                                    />
                                  ) : (
                                    lesson.quiz && (
                                      <InlineQuizEditor
                                        compact
                                        questions={lesson.quiz.questions}
                                        onChange={(questions) =>
                                          setState((s) => ({
                                            ...s,
                                            lessons: s.lessons.map((l) =>
                                              l.id === lesson.id && l.quiz
                                                ? { ...l, quiz: { ...l.quiz, questions } }
                                                : l,
                                            ),
                                          }))
                                        }
                                        durationMinutes={lesson.quiz.durationMinutes}
                                        onDurationChange={(durationMinutes) =>
                                          setState((s) => ({
                                            ...s,
                                            lessons: s.lessons.map((l) =>
                                              l.id === lesson.id && l.quiz
                                                ? { ...l, quiz: { ...l.quiz, durationMinutes } }
                                                : l,
                                            ),
                                          }))
                                        }
                                        passingPercentage={lesson.quiz.passingPercentage}
                                        onPassingChange={(passingPercentage) =>
                                          setState((s) => ({
                                            ...s,
                                            lessons: s.lessons.map((l) =>
                                              l.id === lesson.id && l.quiz
                                                ? { ...l, quiz: { ...l.quiz, passingPercentage } }
                                                : l,
                                            ),
                                          }))
                                        }
                                        maxAttempts={lesson.quiz.maxAttempts}
                                        onMaxAttemptsChange={(maxAttempts) =>
                                          setState((s) => ({
                                            ...s,
                                            lessons: s.lessons.map((l) =>
                                              l.id === lesson.id && l.quiz
                                                ? { ...l, quiz: { ...l.quiz, maxAttempts } }
                                                : l,
                                            ),
                                          }))
                                        }
                                        showResultsInstantly={lesson.quiz.showResultsInstantly}
                                        onShowResultsChange={(showResultsInstantly) =>
                                          setState((s) => ({
                                            ...s,
                                            lessons: s.lessons.map((l) =>
                                              l.id === lesson.id && l.quiz
                                                ? { ...l, quiz: { ...l.quiz, showResultsInstantly } }
                                                : l,
                                            ),
                                          }))
                                        }
                                      />
                                    )
                                  )}
                                </div>
                              )}

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      lessons: s.lessons.filter((l) => l.id !== lesson.id),
                                    }))
                                  }
                                  className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" /> Remove Lesson
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 5: Live Classes */}
      {step === "live" && showLiveStep && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={sectionTitleClass}>Live Classes</h2>
              <p className={helperClass}>Schedule live sessions via Google Meet, Zoom, or YouTube Live</p>
            </div>
            <button type="button" onClick={addLiveClass} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
              <Plus className="h-3.5 w-3.5" /> Add Live Class
            </button>
          </div>

          {state.liveClasses.length === 0 ? (
            <div className={cardClass + " text-center text-sm text-muted-foreground"}>
              No live classes scheduled. Click &quot;Add Live Class&quot; to create one.
            </div>
          ) : (
            state.liveClasses.map((live, idx) => (
              <div key={live.id} className={cardClass + " space-y-4"}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Live Class {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        liveClasses: s.liveClasses.filter((l) => l.id !== live.id),
                      }))
                    }
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={labelClass}>Session Title *</span>
                    <input
                      value={live.title}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liveClasses: s.liveClasses.map((l) =>
                            l.id === live.id ? { ...l, title: e.target.value } : l,
                          ),
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Platform *</span>
                    <select
                      value={live.platform}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liveClasses: s.liveClasses.map((l) =>
                            l.id === live.id ? { ...l, platform: e.target.value as LiveClassPlatform } : l,
                          ),
                        }))
                      }
                      className={selectClass}
                    >
                      <option value="google_meet">Google Meet</option>
                      <option value="zoom">Zoom</option>
                      <option value="youtube">YouTube Live</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Curriculum Section</span>
                    <select
                      value={live.sectionId}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liveClasses: s.liveClasses.map((l) =>
                            l.id === live.id ? { ...l, sectionId: e.target.value } : l,
                          ),
                        }))
                      }
                      className={selectClass}
                    >
                      <option value="">None</option>
                      {state.curriculum.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Scheduled Date & Time *</span>
                    <input
                      type="datetime-local"
                      value={live.scheduledAt}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liveClasses: s.liveClasses.map((l) =>
                            l.id === live.id ? { ...l, scheduledAt: e.target.value } : l,
                          ),
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Duration</span>
                    <input
                      value={live.duration}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liveClasses: s.liveClasses.map((l) =>
                            l.id === live.id ? { ...l, duration: e.target.value } : l,
                          ),
                        }))
                      }
                      placeholder="1h 30m"
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Description</span>
                  <textarea
                    value={live.description}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        liveClasses: s.liveClasses.map((l) =>
                          l.id === live.id ? { ...l, description: e.target.value } : l,
                        ),
                      }))
                    }
                    className={textareaClass + " min-h-[80px]"}
                  />
                </label>

                {live.platform === "google_meet" && (
                  <label className="block">
                    <span className={labelClass}>Google Meet Link *</span>
                    <input
                      value={live.meetingUrl}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liveClasses: s.liveClasses.map((l) =>
                            l.id === live.id ? { ...l, meetingUrl: e.target.value } : l,
                          ),
                        }))
                      }
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className={inputClass}
                    />
                  </label>
                )}

                {live.platform === "zoom" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>Zoom Meeting Link *</span>
                      <input
                        value={live.meetingUrl}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            liveClasses: s.liveClasses.map((l) =>
                              l.id === live.id ? { ...l, meetingUrl: e.target.value } : l,
                            ),
                          }))
                        }
                        placeholder="https://zoom.us/j/..."
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Meeting ID</span>
                      <input
                        value={live.meetingId}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            liveClasses: s.liveClasses.map((l) =>
                              l.id === live.id ? { ...l, meetingId: e.target.value } : l,
                            ),
                          }))
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Passcode</span>
                      <input
                        value={live.passcode}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            liveClasses: s.liveClasses.map((l) =>
                              l.id === live.id ? { ...l, passcode: e.target.value } : l,
                            ),
                          }))
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}

                {live.platform === "youtube" && (
                  <label className="block">
                    <span className={labelClass}>YouTube Live URL *</span>
                    <input
                      value={live.youtubeLiveUrl}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liveClasses: s.liveClasses.map((l) =>
                            l.id === live.id ? { ...l, youtubeLiveUrl: e.target.value } : l,
                          ),
                        }))
                      }
                      placeholder="https://www.youtube.com/live/..."
                      className={inputClass}
                    />
                    <p className={helperClass}>Paste your YouTube Live stream or watch URL</p>
                  </label>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Step: Final Exam */}
      {step === "exams" && (
        <div className={cardClass + " space-y-5"}>
          <div className="flex items-center justify-between">
            <h2 className={sectionTitleClass}>
              <Award className="mr-2 inline h-5 w-5" /> Course Final Examination
            </h2>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={state.finalExam.enabled}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    finalExam: {
                      ...s.finalExam,
                      enabled: e.target.checked,
                      title: s.finalExam.title || `${s.title} — Final Exam`,
                    },
                  }))
                }
              />
              Enable Final Exam
            </label>
          </div>
          <p className={helperClass}>
            Students take the final exam after completing all lessons. Certificate is issued on pass (if enabled).
          </p>

          {state.finalExam.enabled && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["select", "inline"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        finalExam: {
                          ...s.finalExam,
                          quizMode: mode,
                          title: s.finalExam.title || `${s.title} — Final Exam`,
                        },
                      }))
                    }
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold",
                      state.finalExam.quizMode === mode
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground",
                    )}
                  >
                    {mode === "select" ? "Select from Library" : "Create Inline"}
                  </button>
                ))}
              </div>

              {state.finalExam.quizMode === "select" ? (
                <QuizPicker
                  value={state.finalExam.quizId}
                  kind="final_exam"
                  courseId={courseId}
                  instructorId={state.instructorId || undefined}
                  label="Choose final exam from quiz library"
                  onChange={(quizId, quiz) =>
                    setState((s) => ({
                      ...s,
                      finalExam: {
                        ...s.finalExam,
                        quizId,
                        title: quiz.title,
                      },
                    }))
                  }
                />
              ) : (
                <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Exam Title</span>
                  <input
                    value={state.finalExam.title}
                    onChange={(e) =>
                      setState((s) => ({ ...s, finalExam: { ...s.finalExam, title: e.target.value } }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Description</span>
                  <textarea
                    value={state.finalExam.description}
                    onChange={(e) =>
                      setState((s) => ({ ...s, finalExam: { ...s.finalExam, description: e.target.value } }))
                    }
                    className={textareaClass + " min-h-[60px]"}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Instructions</span>
                  <textarea
                    value={state.finalExam.instructions}
                    onChange={(e) =>
                      setState((s) => ({ ...s, finalExam: { ...s.finalExam, instructions: e.target.value } }))
                    }
                    className={textareaClass + " min-h-[60px]"}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [state.finalExam.shuffleQuestions, (v: boolean) => ({ shuffleQuestions: v }), "Shuffle questions"],
                  [state.finalExam.shuffleOptions, (v: boolean) => ({ shuffleOptions: v }), "Shuffle options"],
                  [state.finalExam.issueCertificateOnPass, (v: boolean) => ({ issueCertificateOnPass: v }), "Issue certificate on pass"],
                  [state.finalExam.enableProctoring, (v: boolean) => ({ enableProctoring: v }), "Enable proctoring (tab switch)"],
                  [state.finalExam.autoSubmitOnProctorViolation, (v: boolean) => ({ autoSubmitOnProctorViolation: v }), "Auto-submit on violations"],
                  [state.finalExam.requireFullscreen, (v: boolean) => ({ requireFullscreen: v }), "Require fullscreen"],
                ].map(([checked, patch, label]) => (
                  <label key={String(label)} className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(checked)}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          finalExam: { ...s.finalExam, ...(patch as (v: boolean) => object)(e.target.checked) },
                        }))
                      }
                    />
                    {String(label)}
                  </label>
                ))}
              </div>

              {state.finalExam.issueCertificateOnPass && (
                <div className="border-t border-border pt-4">
                  <p className={labelClass}>Certificate Template</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Design students receive on passing — includes director signature, QR verification & certificate number.
                  </p>
                  <div className="mt-3">
                    <CertificateTemplatePicker
                      value={state.finalExam.certificateTemplate}
                      onChange={(certificateTemplate) =>
                        setState((s) => ({ ...s, finalExam: { ...s.finalExam, certificateTemplate } }))
                      }
                    />
                  </div>
                </div>
              )}

              <InlineQuizEditor
                questions={state.finalExam.questions}
                onChange={(questions) =>
                  setState((s) => ({ ...s, finalExam: { ...s.finalExam, questions } }))
                }
                durationMinutes={state.finalExam.durationMinutes}
                onDurationChange={(durationMinutes) =>
                  setState((s) => ({ ...s, finalExam: { ...s.finalExam, durationMinutes } }))
                }
                passingPercentage={state.finalExam.passingPercentage}
                onPassingChange={(passingPercentage) =>
                  setState((s) => ({ ...s, finalExam: { ...s.finalExam, passingPercentage } }))
                }
                maxAttempts={state.finalExam.maxAttempts}
                onMaxAttemptsChange={(maxAttempts) =>
                  setState((s) => ({ ...s, finalExam: { ...s.finalExam, maxAttempts } }))
                }
                showResultsInstantly={state.finalExam.showResultsInstantly}
                onShowResultsChange={(showResultsInstantly) =>
                  setState((s) => ({ ...s, finalExam: { ...s.finalExam, showResultsInstantly } }))
                }
              />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 6: Review */}
      {step === "review" && (
        <div className={cardClass + " space-y-5"}>
          <h2 className={sectionTitleClass}>Review & Publish</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Title</dt><dd className="font-semibold">{state.title || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Mode</dt><dd className="font-semibold capitalize">{state.mode}</dd></div>
            <div><dt className="text-muted-foreground">MRP</dt><dd className="font-semibold line-through text-muted-foreground">₹{state.originalPrice || 0}</dd></div>
            <div><dt className="text-muted-foreground">Selling Price</dt><dd className="font-semibold text-primary">₹{state.sellingPrice || 0}</dd></div>
            <div><dt className="text-muted-foreground">Discount</dt><dd className="font-semibold">{discountPercent(Number(state.originalPrice) || 0, Number(state.sellingPrice) || 0)}% OFF</dd></div>
            <div><dt className="text-muted-foreground">Duration</dt><dd className="font-semibold">{state.duration || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Sections</dt><dd className="font-semibold">{state.curriculum.length}</dd></div>
            <div><dt className="text-muted-foreground">Lessons</dt><dd className="font-semibold">{state.lessons.length} ({state.lessons.filter((l) => l.lessonType === "quiz").length} quizzes)</dd></div>
            <div><dt className="text-muted-foreground">Live Classes</dt><dd className="font-semibold">{state.liveClasses.length}</dd></div>
            <div><dt className="text-muted-foreground">Final Exam</dt><dd className="font-semibold">{state.finalExam.enabled ? "Yes" : "No"}</dd></div>
            <div><dt className="text-muted-foreground">Status</dt><dd className="font-semibold capitalize">{state.status}</dd></div>
          </dl>
          <p className="text-sm text-muted-foreground">
            {state.description.slice(0, 200)}{state.description.length > 200 ? "..." : ""}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        <div className="flex gap-3">
          {step !== "review" ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:flex-none"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:flex-none"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : isEdit ? "Update Course" : "Create Course"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
