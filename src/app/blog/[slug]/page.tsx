"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type { PublicBlogCard } from "@/lib/admin/types";

type BlogDetail = PublicBlogCard & { content: string };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [post, setPost] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetch(`/api/blog/${encodeURIComponent(slug)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.error || "Post not found");
        setPost(json.data);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load article");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  return (
    <main className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />

      {loading ? (
        <Container className="py-20 text-center text-muted-foreground">Loading article...</Container>
      ) : error || !post ? (
        <Container className="py-20 text-center">
          <p className="text-red-600">{error || "Article not found"}</p>
          <Link href="/blog" className="mt-4 inline-block text-sm font-semibold text-primary">
            Back to blog
          </Link>
        </Container>
      ) : (
        <>
          <section className="bg-hero-soft py-12 sm:py-16">
            <Container className="max-w-3xl">
              <Link
                href="/blog"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" /> All articles
              </Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary">
                <Tag className="h-3 w-3" />
                {post.category || "Article"}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 text-muted-foreground">{post.excerpt}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </Container>
          </section>

          <PageBand tone="blog">
            <Container className="max-w-3xl">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="mb-8 aspect-[16/9] w-full rounded-xl object-cover shadow-card"
                />
              ) : (
                <div className="mb-8 aspect-[16/9] rounded-xl bg-primary/15 shadow-card" />
              )}
              <article className="prose prose-slate max-w-none whitespace-pre-wrap text-[15px] leading-7 text-foreground/85">
                {post.content}
              </article>
              <div className="mt-10 rounded-xl border border-border bg-card p-6 text-center shadow-card">
                <p className="font-bold text-ink">Ready to start learning?</p>
                <Link
                  href="/courses"
                  className="mt-3 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Browse courses
                </Link>
              </div>
            </Container>
          </PageBand>
        </>
      )}

      <SiteFooter />
    </main>
  );
}
