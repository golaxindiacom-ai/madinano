"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Calendar, Clock, Search, Tag, User } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type { PublicBlogCard } from "@/lib/admin/types";

type ApiResponse<T> = { success: boolean; data?: T };

const FALLBACK_GRADIENTS = [
  "from-primary/80 to-primary/40",
  "from-primary/70 to-gold/50",
  "from-ink/70 to-primary/50",
  "from-primary/60 to-ink/40",
  "from-gold/60 to-primary/50",
  "from-primary/50 to-muted",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error("Failed to load data");
  }

  return payload.data as T;
}

function PostSkeleton() {
  return <div className="h-80 animate-pulse rounded-xl bg-muted/50" />;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<PublicBlogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      try {
        setLoading(true);
        setError("");
        const data = await getJson<PublicBlogCard[]>("/api/blog", controller.signal);
        setPosts(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setPosts([]);
          setError("Unable to load blog posts right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(posts.map((post) => post.category).filter(Boolean)))];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const matchesSearch =
        !query ||
        [post.title, post.excerpt, post.author, post.category].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [posts, search, category]);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <main className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />

      <PageHero
        kicker="Our Blog"
        title={
          <>
            Stories, Ideas & <span className="text-primary">Insights</span>
          </>
        }
        subtitle="Fresh updates from our instructors, learning community, and latest course trends."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      >
        <label className="relative mx-auto block max-w-lg">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search articles..."
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-primary"
          />
        </label>
      </PageHero>

      <PageBand tone="blog">
        <Container>
          {loading ? (
            <div className="space-y-6">
              <div className="h-72 animate-pulse rounded-xl bg-muted/50" />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <PostSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
              <AlertCircle className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-ink">Could not load the blog.</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center shadow-card">
              <p className="text-sm font-semibold text-ink">No articles found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different search or category filter.
              </p>
            </div>
          ) : (
            <>
              {categories.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        category === item
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground/80 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}

              {featuredPost ? (
                <article className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
                    <div className="relative aspect-video md:aspect-auto">
                      {featuredPost.coverImage ? (
                        <img
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/70 to-primary/30" />
                      )}
                    </div>

                    <div className="p-8">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary">
                        <Tag className="h-3 w-3" />
                        {featuredPost.category || "Featured"}
                      </span>

                      <h2 className="mt-3 text-2xl font-extrabold leading-tight text-ink md:text-3xl">
                        {featuredPost.title}
                      </h2>

                      <p className="mt-3 text-sm text-muted-foreground">{featuredPost.excerpt}</p>

                      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {featuredPost.author}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(featuredPost.publishedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {featuredPost.readTime}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                      >
                        Read Article <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ) : null}

              {remainingPosts.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingPosts.map((post, index) => (
                    <article
                      key={post.id}
                      className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:border-primary/60 hover:shadow-float"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`h-full w-full bg-gradient-to-br ${FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]}`}
                          />
                        )}

                        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-bold text-ink shadow-card">
                          {post.category}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="text-base font-bold leading-snug text-ink transition group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {post.excerpt}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.publishedAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        </div>

                        <Link
                          href={`/blog/${post.slug}`}
                          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                        >
                          Read More <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </Container>
      </PageBand>

      <SiteFooter />
    </main>
  );
}
