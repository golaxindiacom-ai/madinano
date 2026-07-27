"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, MapPin, Star, Users } from "lucide-react";
import { PublicCourseCard } from "@/components/course/public-course-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type {
  PublicCourseCard as PublicCourseCardType,
  PublicInstructorCard,
} from "@/lib/admin/types";

type InstructorDetail = Omit<PublicInstructorCard, "courses"> & {
  courses: PublicCourseCardType[];
};

type ApiResponse<T> = { success: boolean; data?: T };

function formatCount(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(".0", "")}K` : `${value}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error("Failed to load data");
  }

  return payload.data;
}

export default function InstructorDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    async function loadInstructor() {
      try {
        setLoading(true);
        setNotFound(false);
        setError("");
        setInstructor(null);

        const data = await getJson<InstructorDetail>(
          `/api/instructors/${encodeURIComponent(slug)}`,
          controller.signal,
        );

        setInstructor(data);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        if ((requestError as Error).message === "NOT_FOUND") {
          setNotFound(true);
          return;
        }

        setError("This instructor profile could not be loaded right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInstructor();

    return () => controller.abort();
  }, [slug]);

  const expertise = useMemo(() => {
    return (instructor?.expertise ?? "")
      .split(/[,|/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [instructor?.expertise]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteTopBar />
      <SiteHeader />

      {loading ? (
        <>
          <PageHero
            kicker="Instructor"
            title="Loading profile…"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Instructors", href: "/instructors" },
            ]}
          />
          <PageBand tone="instructors">
            <Container>
              <div className="space-y-7">
                <div className="h-52 animate-pulse rounded-xl bg-muted/50" />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-80 animate-pulse rounded-xl bg-muted/50" />
                  ))}
                </div>
              </div>
            </Container>
          </PageBand>
        </>
      ) : notFound ? (
        <>
          <PageHero
            kicker="Instructor"
            title="Instructor not found"
            subtitle="This instructor profile is unavailable."
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Instructors", href: "/instructors" },
              { label: "Not found" },
            ]}
          />
          <PageBand tone="instructors">
            <Container className="text-center">
              <Users className="mx-auto h-11 w-11 text-muted-foreground" />
              <Link
                href="/instructors"
                className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Browse instructors
              </Link>
            </Container>
          </PageBand>
        </>
      ) : error || !instructor ? (
        <>
          <PageHero
            kicker="Instructor"
            title="Unable to load instructor"
            subtitle={error || "Please try again in a moment."}
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Instructors", href: "/instructors" },
            ]}
          />
          <PageBand tone="instructors">
            <Container className="text-center">
              <Link
                href="/instructors"
                className="inline-flex rounded-full border border-primary px-5 py-2.5 text-sm font-bold text-primary"
              >
                Back to instructors
              </Link>
            </Container>
          </PageBand>
        </>
      ) : (
        <>
          <PageHero
            kicker="Instructor"
            title={instructor.name}
            subtitle={instructor.title || "Instructor"}
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Instructors", href: "/instructors" },
              { label: instructor.name },
            ]}
          >
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
              <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-xl border border-border bg-primary/10 text-3xl font-extrabold text-primary shadow-card">
                {instructor.avatarUrl ? (
                  <img
                    src={instructor.avatarUrl}
                    alt={instructor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(instructor.name)
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  {instructor.rating.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatCount(instructor.students)} students
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {instructor.courses.length} courses
                </span>
                {instructor.country ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {instructor.country}
                  </span>
                ) : null}
              </div>
            </div>
          </PageHero>

          <PageBand tone="why">
            <Container>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
                <h2 className="text-xl font-extrabold text-ink">About {instructor.name}</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {instructor.bio || "No biography is available yet."}
                </p>

                {expertise.length > 0 ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {expertise.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Container>
          </PageBand>

          <PageBand tone="instructors">
            <Container>
              <div className="mb-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                  Published courses
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-ink">
                  Courses by {instructor.name}
                </h2>
              </div>

              {instructor.courses.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {instructor.courses.map((course) => (
                    <PublicCourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground shadow-card">
                  No published courses are available for this instructor.
                </div>
              )}
            </Container>
          </PageBand>
        </>
      )}

      <SiteFooter />
    </main>
  );
}
