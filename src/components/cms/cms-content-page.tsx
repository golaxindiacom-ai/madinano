"use client";

import { useEffect, useState } from "react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type { CmsPage } from "@/lib/admin/types";

type CmsContentPageProps = {
  slug: string;
  kicker?: string;
  children?: React.ReactNode;
};

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

export function CmsContentPage({ slug, kicker = "Navbharat Gurukulam", children }: CmsContentPageProps) {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
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
  }, [slug]);

  const breadcrumbLabel = page?.title || slug.replace(/-/g, " ");

  return (
    <main className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />

      {loading ? (
        <PageBand tone="faq">
          <Container className="py-16 text-center text-sm text-muted-foreground">
            Loading page…
          </Container>
        </PageBand>
      ) : notFound ? (
        <>
          <PageHero
            kicker={kicker}
            title="Page not found"
            subtitle="The page you are looking for is unavailable."
            breadcrumbs={[{ label: "Home", href: "/" }, { label: "Not found" }]}
          />
          <PageBand tone="faq">
            <Container className="max-w-3xl text-sm text-muted-foreground">
              This CMS page has not been published yet.
            </Container>
          </PageBand>
        </>
      ) : error || !page ? (
        <>
          <PageHero
            kicker={kicker}
            title="Unable to load"
            subtitle="Please refresh and try again."
            breadcrumbs={[{ label: "Home", href: "/" }, { label: breadcrumbLabel }]}
          />
          <PageBand tone="faq">
            <Container className="max-w-3xl text-sm text-red-600">
              {error || "Something went wrong while loading this page."}
            </Container>
          </PageBand>
        </>
      ) : (
        <>
          <PageHero
            kicker={kicker}
            title={page.title}
            subtitle={page.excerpt}
            breadcrumbs={[{ label: "Home", href: "/" }, { label: page.title }]}
          >
            {children}
          </PageHero>
          <PageBand tone="faq">
            <Container className="max-w-3xl space-y-6">
              {page.content?.trim()
                ? renderCmsBody(page.content)
                : (
                  <p className="text-sm text-muted-foreground">
                    Content will appear here once published.
                  </p>
                )}
            </Container>
          </PageBand>
        </>
      )}

      <SiteFooter />
    </main>
  );
}
