"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BuyOrCartActions } from "@/components/cart/add-to-cart-button";
import { PageBand } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type { CurriculumSection, PublicCourseCard, PublicInstructorCard } from "@/lib/admin/types";

type CourseDetail = PublicCourseCard & {
  description?: string;
  requirements?: string[];
  outcomes?: string[];
  curriculum?: CurriculumSection[];
  language?: string;
  instructor?: PublicInstructorCard | null;
};

function formatPrice(value: number) {
  return value.toLocaleString("en-IN");
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;
    const controller = new AbortController();
    fetch(`/api/courses/${courseId}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.error || "Course not found");
        setCourse(json.data);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load course");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [courseId]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteTopBar />
      <SiteHeader />

      {loading ? (
        <Container className="py-20 text-center text-muted-foreground">Loading course...</Container>
      ) : error || !course ? (
        <Container className="py-20 text-center">
          <p className="text-red-600">{error || "Course not found"}</p>
          <Link href="/courses" className="mt-4 inline-block text-sm font-semibold text-primary">
            Back to courses
          </Link>
        </Container>
      ) : (
        <>
          <section className="bg-hero-soft py-12 sm:py-16">
            <Container>
              <Link
                href="/courses"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" /> All courses
              </Link>

              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                      {course.categoryName}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                      {course.level}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                      {course.mode}
                    </span>
                  </div>
                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
                    {course.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-muted-foreground">
                    {course.shortDescription || course.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-gold text-gold" />
                      {course.rating.toFixed(1)} rating
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {course.enrollments.toLocaleString("en-IN")} students
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      {course.lessonCount} lessons
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </span>
                  </div>

                  {course.instructor ? (
                    <Link
                      href={`/instructors/${course.instructor.slug}`}
                      className="mt-6 inline-flex items-center gap-3 rounded-xl border border-border bg-card/80 px-4 py-3 shadow-card hover:border-primary"
                    >
                      {course.instructor.avatarUrl ? (
                        <img
                          src={course.instructor.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 font-bold text-primary">
                          {course.instructor.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-ink">{course.instructor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.instructor.title || course.instructor.expertise}
                        </p>
                      </div>
                    </Link>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  <div className="relative aspect-video bg-gradient-to-br from-maroon/20 to-primary/20">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <GraduationCap className="h-12 w-12 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-extrabold text-ink">
                        ₹{formatPrice(course.sellingPrice)}
                      </span>
                      {course.originalPrice > course.sellingPrice ? (
                        <span className="pb-1 text-sm text-muted-foreground line-through">
                          ₹{formatPrice(course.originalPrice)}
                        </span>
                      ) : null}
                      {course.discountPercent > 0 ? (
                        <span className="pb-1 text-sm font-bold text-emerald-600">
                          {course.discountPercent}% off
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5 flex flex-col gap-3">
                      <BuyOrCartActions courseId={course.id} sellingPrice={course.sellingPrice} />
                      <Link
                        href={`/courses/${course.id}/learn`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-ink hover:border-primary hover:text-primary"
                      >
                        <PlayCircle className="h-4 w-4" /> Preview / Learn
                      </Link>
                    </div>
                    <p className="mt-4 text-center text-[11px] text-muted-foreground">
                      Instant enrollment after successful payment
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          <PageBand tone="courses">
            <Container>
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-8">
                {course.description ? (
                  <section>
                    <h2 className="text-xl font-extrabold text-ink">About this course</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {course.description}
                    </p>
                  </section>
                ) : null}

                {course.outcomes && course.outcomes.length > 0 ? (
                  <section>
                    <h2 className="text-xl font-extrabold text-ink">What you&apos;ll learn</h2>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {course.outcomes.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-foreground/80">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {course.curriculum && course.curriculum.length > 0 ? (
                  <section>
                    <h2 className="text-xl font-extrabold text-ink">Curriculum</h2>
                    <div className="mt-4 space-y-3">
                      {course.curriculum
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((section, index) => (
                          <div
                            key={section.id || index}
                            className="rounded-xl border border-border bg-card p-4 shadow-card"
                          >
                            <h3 className="font-bold text-ink">
                              {index + 1}. {section.title}
                            </h3>
                            {section.description ? (
                              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="space-y-6">
                {course.requirements && course.requirements.length > 0 ? (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <h3 className="font-bold text-ink">Requirements</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {course.requirements.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <h3 className="font-bold text-ink">Course details</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Level</dt>
                      <dd className="font-semibold capitalize text-ink">{course.level}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd className="font-semibold text-ink">{course.duration}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Mode</dt>
                      <dd className="font-semibold capitalize text-ink">{course.mode}</dd>
                    </div>
                    {course.language ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Language</dt>
                        <dd className="font-semibold text-ink">{course.language}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </aside>
            </div>
            </Container>
          </PageBand>
        </>
      )}

      <SiteFooter />
    </main>
  );
}
