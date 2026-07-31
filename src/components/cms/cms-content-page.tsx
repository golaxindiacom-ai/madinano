"use client";

import { useEffect, useState } from "react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import type { CmsPage } from "@/lib/admin/types";

type CmsContentPageProps = {
  slug: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  /** When provided (including null), skips client fetch — use from server components. */
  initialPage?: CmsPage | null;
  children?: React.ReactNode;
};

const DEFAULT_PAGE_HERO: Record<string, { title: string; subtitle?: string }> = {
  about: {
    title: "About Us",
    subtitle: "Empowering learners worldwide through research-led education.",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    subtitle: "How Madinano collects, uses, and protects your information.",
  },
  terms: {
    title: "Terms of Use",
    subtitle: "Rules for using Madinano courses, exams, and platform services.",
  },
};

function slugToTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/70", className)} />;
}

function CmsBodySkeleton() {
  return (
    <Container className="max-w-3xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </Container>
  );
}

function renderCmsBody(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const textLines = lines.filter((line) => !line.startsWith("- "));
    const listLines = lines.filter((line) => line.startsWith("- "));

    return (
      <div key={index} className="space-y-3">
        {textLines.length > 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {textLines.join(" ")}
          </p>
        ) : null}
        {listLines.length > 0 ? (
          <ul className="space-y-3">
            {listLines.map((line) => (
              <li
                key={line}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-ink shadow-card"
              >
                {line.slice(2).trim()}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  });
}

export function CmsContentPage({
  slug,
  kicker = "Madinano",
  title: titleProp,
  subtitle: subtitleProp,
  initialPage,
  children,
}: CmsContentPageProps) {
  const hasServerData = initialPage !== undefined;
  const [page, setPage] = useState<CmsPage | null>(initialPage ?? null);
  const [loading, setLoading] = useState(!hasServerData);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(hasServerData && initialPage === null);

  const fallbackHero = DEFAULT_PAGE_HERO[slug] ?? {
    title: titleProp ?? slugToTitle(slug),
    subtitle: subtitleProp,
  };

  const heroTitle =
    notFound ? "Page not found" : error && !page ? "Unable to load" : page?.title ?? titleProp ?? fallbackHero.title;
  const heroSubtitle =
    notFound
      ? "The page you are looking for is unavailable."
      : error && !page
        ? "Please refresh and try again."
        : page?.excerpt ?? subtitleProp ?? fallbackHero.subtitle;
  const breadcrumbLabel = page?.title ?? titleProp ?? fallbackHero.title;

  useEffect(() => {
    if (hasServerData) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setNotFound(false);
    setPage(null);

    fetch(`/api/pages/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = await response.json();
        if (response.status === 404 || json.error === "Page not found") {
          setNotFound(true);
          return;
        }
        if (!response.ok || !json.success) {
          throw new Error(json.error || "Failed to load page");
        }
        setPage(json.data as CmsPage);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load page");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug, hasServerData]);

  return (
    <main className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />

      <PageHero
        kicker={kicker}
        title={heroTitle}
        subtitle={heroSubtitle}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: breadcrumbLabel }]}
      >
        {children}
      </PageHero>

      {loading ? (
        <PageBand tone="faq">
          <CmsBodySkeleton />
        </PageBand>
      ) : notFound ? (
        <PageBand tone="faq">
          <Container className="max-w-3xl text-sm text-muted-foreground">
            This CMS page has not been published yet.
          </Container>
        </PageBand>
      ) : error || !page ? (
        <PageBand tone="faq">
          <Container className="max-w-3xl text-sm text-red-600">
            {error || "Something went wrong while loading this page."}
          </Container>
        </PageBand>
      ) : (
        <PageBand tone="faq">
          <Container className="max-w-3xl space-y-6">
            {page.content?.trim() ? (
              renderCmsBody(page.content)
            ) : (
              <p className="text-sm text-muted-foreground">Content will appear here once published.</p>
            )}
          </Container>
        </PageBand>
      )}

      <SiteFooter />
    </main>
  );
}
