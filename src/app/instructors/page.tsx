"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { PublicInstructorCard } from "@/components/course/public-instructor-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type { PublicInstructorCard as PublicInstructorCardType } from "@/lib/admin/types";

type ApiResponse<T> = { success: boolean; data?: T };

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error("Failed to load data");
  }

  return payload.data as T;
}

function InstructorSkeleton() {
  return <div className="h-80 animate-pulse rounded-xl bg-muted/50" />;
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<PublicInstructorCardType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInstructors() {
      try {
        setLoading(true);
        setError("");
        const data = await getJson<PublicInstructorCardType[]>("/api/instructors", controller.signal);
        setInstructors(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setInstructors([]);
          setError("Instructors could not be loaded. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInstructors();

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return instructors;

    return instructors.filter((instructor) =>
      [instructor.name, instructor.title, instructor.expertise, instructor.bio, instructor.country]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [instructors, search]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteTopBar />
      <SiteHeader />

      <PageHero
        kicker="Our instructors"
        title={
          <>
            Learn from <span className="text-primary">experts</span>
          </>
        }
        subtitle="Discover instructor profiles, expertise, student reach, and published courses."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Instructors" }]}
      >
        <label className="relative mx-auto block max-w-xl">
          <span className="sr-only">Search instructors</span>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, title, expertise, or location"
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
      </PageHero>

      <PageBand tone="instructors">
        <Container>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-ink">Instructor directory</h2>
            {!loading && !error ? (
              <p className="text-sm text-muted-foreground">
                {filtered.length} instructor{filtered.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <InstructorSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground shadow-card">
              {error}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((instructor) => (
                <PublicInstructorCard key={instructor.id} instructor={instructor} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center shadow-card">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-bold text-ink">No instructors found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search.</p>
            </div>
          )}
        </Container>
      </PageBand>

      <SiteFooter />
    </main>
  );
}
