"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Lock,
  Play,
  Video,
} from "lucide-react";
import type { CourseLearnPayload } from "@/lib/admin/types";
import { youtubeEmbedUrl } from "@/lib/admin/youtube";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function CourseLearnPage({ courseId }: { courseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<CourseLearnPayload | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/learn`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setData(j.data);
          const fromUrl = searchParams.get("lesson");
          const first = j.data.lessons[0]?.id ?? null;
          setActiveLessonId(fromUrl && j.data.lessons.some((l: { id: string }) => l.id === fromUrl) ? fromUrl : first);
        }
      });
  }, [courseId, searchParams]);

  const activeLesson = useMemo(
    () => data?.lessons.find((l) => l.id === activeLessonId) ?? null,
    [data, activeLessonId],
  );

  const lessonIndex = data?.lessons.findIndex((l) => l.id === activeLessonId) ?? -1;
  const prevLesson = lessonIndex > 0 ? data?.lessons[lessonIndex - 1] : null;
  const nextLesson = data && lessonIndex >= 0 && lessonIndex < data.lessons.length - 1 ? data.lessons[lessonIndex + 1] : null;

  const openQuiz = (quizId: string, lessonId?: string) => {
    const params = new URLSearchParams({ courseId });
    if (lessonId) params.set("lessonId", lessonId);
    router.push(`/exams/${quizId}?${params.toString()}`);
  };

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading course...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <main className="py-6">
        <Container>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Link href="/courses" className="font-semibold text-primary">Courses</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link href={`/courses/${courseId}`} className="font-semibold text-primary hover:underline">
              {data.course.title}
            </Link>
          </div>

          {data.access?.preview ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">Preview mode</p>
                  <p className="mt-1 text-xs">
                    {data.access.message || "Enroll to unlock the full curriculum."}
                  </p>
                </div>
              </div>
              <Link
                href={`/checkout/${courseId}`}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Enroll now
              </Link>
            </div>
          ) : null}

          {data.access?.preview && data.lessons.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-semibold text-ink">Full lessons unlock after enrollment</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This course has no free preview clips yet. Enroll to access the complete curriculum.
              </p>
              <Link
                href={`/checkout/${courseId}`}
                className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Buy / Enroll
              </Link>
            </div>
          ) : null}

          {!(data.access?.preview && data.lessons.length === 0) ? (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Sidebar */}
            <aside className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-24">
              <h2 className="font-bold text-ink">{data.course.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{data.course.instructorName}</p>
              <div className="mt-4 space-y-4">
                {data.course.curriculum.map((section) => {
                  const sectionLessons = data.lessons.filter((l) => l.sectionId === section.id);
                  if (!sectionLessons.length) return null;
                  return (
                    <div key={section.id}>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{section.title}</p>
                      <ul className="mt-2 space-y-1">
                        {sectionLessons.map((lesson) => (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              onClick={() => setActiveLessonId(lesson.id)}
                              className={cn(
                                "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
                                activeLessonId === lesson.id ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted/60",
                              )}
                            >
                              {lesson.lessonType === "video" && <Video className="mt-0.5 h-4 w-4 shrink-0" />}
                              {lesson.lessonType === "text" && <FileText className="mt-0.5 h-4 w-4 shrink-0" />}
                              {lesson.lessonType === "quiz" && <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />}
                              <span className="line-clamp-2">{lesson.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {data.finalExam && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Final Examination</p>
                    <button
                      type="button"
                      onClick={() => openQuiz(data.finalExam!.id)}
                      className="mt-2 flex w-full items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-left text-sm font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      <Award className="h-4 w-4 shrink-0" />
                      {data.finalExam.title}
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* Content */}
            <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
              {!activeLesson ? (
                <div className="py-16 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-4">Select a lesson from the curriculum</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">{activeLesson.lessonType.replace("_", " ")}</p>
                      <h1 className="mt-1 text-2xl font-extrabold text-ink">{activeLesson.title}</h1>
                      {activeLesson.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{activeLesson.description}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{activeLesson.duration}</span>
                  </div>

                  <div className="mt-6">
                    {activeLesson.lessonType === "video" && activeLesson.videoId && (
                      <div className="overflow-hidden rounded-xl border border-border">
                        <div className="aspect-video bg-black">
                          <iframe
                            src={youtubeEmbedUrl(activeLesson.videoId, activeLesson.isPrivateVideo)}
                            title={activeLesson.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {activeLesson.lessonType === "text" && (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-xl bg-muted/30 p-5 text-foreground/90">
                        {activeLesson.content || "No content available for this lesson."}
                      </div>
                    )}

                    {activeLesson.lessonType === "quiz" && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                        <ClipboardList className="mx-auto h-12 w-12 text-primary" />
                        <h2 className="mt-4 text-lg font-bold text-ink">Short Quiz</h2>
                        {activeLesson.quiz ? (
                          <>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {activeLesson.quiz.questions} questions · {activeLesson.quiz.durationMinutes} min · Pass {activeLesson.quiz.passingPercentage}%
                            </p>
                            <button
                              type="button"
                              onClick={() => openQuiz(activeLesson.quiz!.id, activeLesson.id)}
                              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
                            >
                              <Play className="h-4 w-4" /> Start Quiz
                            </button>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">Quiz not configured yet.</p>
                        )}
                      </div>
                    )}

                    {activeLesson.lessonType === "assignment" && (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                        <Lock className="mx-auto h-10 w-10 opacity-40" />
                        <p className="mt-3">Assignment submission coming soon</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                    {prevLesson ? (
                      <button
                        type="button"
                        onClick={() => setActiveLessonId(prevLesson.id)}
                        className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-semibold"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>
                    ) : <span />}
                    {nextLesson ? (
                      <button
                        type="button"
                        onClick={() => setActiveLessonId(nextLesson.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : data.finalExam ? (
                      <button
                        type="button"
                        onClick={() => openQuiz(data.finalExam!.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Award className="h-4 w-4" /> Take Final Exam
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Course completed
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          ) : null}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
