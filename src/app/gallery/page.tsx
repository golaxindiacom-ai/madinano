"use client";

import { useEffect, useState } from "react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type { GalleryItem } from "@/lib/admin/types";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/gallery", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "Failed to load gallery");
        }
        setItems((json.data as GalleryItem[]) ?? []);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load gallery");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Campus Life"
        title="Gallery"
        subtitle="Moments from classrooms, events, and learner journeys at Madinano."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
      />
      <PageBand tone="blog">
        <Container>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading gallery…</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No gallery images published yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                  <figcaption className="space-y-1 p-4">
                    <p className="text-sm font-bold text-ink">{item.title}</p>
                    {item.category ? (
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {item.category}
                      </p>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Container>
      </PageBand>
      <SiteFooter />
    </main>
  );
}
