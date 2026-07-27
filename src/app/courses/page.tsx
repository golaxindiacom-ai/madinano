"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { PublicCourseCard } from "@/components/course/public-course-card";
import type { Category, PublicCourseCard as PublicCourseCardType } from "@/lib/admin/types";

type Sort = "popular" | "rating" | "newest" | "price-low" | "price-high";
type PublicCategory = Pick<Category, "id" | "name" | "slug" | "level" | "parentId" | "courseCount">;
type ApiResponse<T> = { success: boolean; data?: T };

const LEVELS: PublicCourseCardType["level"][] = ["beginner", "intermediate", "advanced"];
const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error("Failed to load data");
  }

  return payload.data as T;
}

function CourseSkeleton() {
  return <div className="h-80 animate-pulse rounded-xl bg-muted/50" />;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<PublicCourseCardType[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState<Sort>("popular");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategoryId(params.get("categoryId") ?? "");
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        setLoadingCategories(true);
        setCategoriesError("");
        const data = await getJson<PublicCategory[]>("/api/categories", controller.signal);
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCategories([]);
          setCategoriesError("Category filters are unavailable right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (categoryId) query.set("categoryId", categoryId);
      if (level) query.set("level", level);
      query.set("sort", sort);

      try {
        setLoadingCourses(true);
        setCoursesError("");
        const data = await getJson<PublicCourseCardType[]>(
          `/api/courses?${query.toString()}`,
          controller.signal,
        );
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCourses([]);
          setCoursesError("Courses could not be loaded. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCourses(false);
        }
      }
    }

    void loadCourses();

    return () => controller.abort();
  }, [categoryId, level, search, sort]);

  const activeFilterCount = useMemo(
    () => [search, categoryId, level].filter(Boolean).length,
    [search, categoryId, level],
  );

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategoryId("");
    setLevel("");
    setSort("popular");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteTopBar />
      <SiteHeader />

      <PageHero
        title={
          <>
            Find your next <span className="text-primary">course</span>
          </>
        }
        subtitle="Explore live course data, compare prices, and start learning with expert-led programs."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Courses" }]}
      >
        <label className="relative mx-auto block max-w-2xl">
          <span className="sr-only">Search courses</span>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search courses, skills, or topics"
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
      </PageHero>

      <PageBand tone="courses">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-ink">Filters</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeFilterCount > 0
                      ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`
                      : "Refine by category, level, and sort"}
                  </p>
                </div>
                <button onClick={clearFilters} className="text-xs font-bold text-primary">
                  Clear
                </button>
              </div>

              <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-ink">
                Category
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={loadingCategories}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.courseCount})
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-ink">
                Level
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal capitalize outline-none focus:border-primary"
                >
                  <option value="">All levels</option>
                  {LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              {categoriesError ? (
                <p className="mt-4 text-xs text-muted-foreground">{categoriesError}</p>
              ) : null}
            </aside>

            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {loadingCourses
                      ? "Loading courses..."
                      : `${courses.length} course${courses.length === 1 ? "" : "s"} found`}
                  </p>
                  {search ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Showing results for "{search}"
                    </p>
                  ) : null}
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Sort
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as Sort)}
                    className="h-10 rounded-xl border border-border bg-card px-3 font-semibold text-ink outline-none focus:border-primary"
                  >
                    {SORT_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {loadingCourses ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <CourseSkeleton key={index} />
                  ))}
                </div>
              ) : coursesError ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground shadow-card">
                  {coursesError}
                </div>
              ) : courses.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {courses.map((course) => (
                    <PublicCourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-12 text-center shadow-card">
                  <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 font-bold text-ink">No courses found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different search term or clear the filters.
                  </p>
                  <button onClick={clearFilters} className="mt-4 text-sm font-bold text-primary">
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </PageBand>

      <SiteFooter />
    </main>
  );
}
