"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Calendar, Clock, Play, Radio, Users, Video } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import type { PublicLiveClassItem } from "@/lib/admin/types";

type Payload = {
  featured: PublicLiveClassItem | null;
  upcoming: PublicLiveClassItem[];
  all: PublicLiveClassItem[];
};

function formatSchedule(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "—" };
  return {
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

const GRADS = [
  "from-primary/80 to-primary/40",
  "from-primary/70 to-gold/50",
  "from-ink/70 to-primary/50",
  "from-gold/60 to-primary/50",
  "from-primary/60 to-ink/40",
  "from-primary/50 to-muted",
];

export function LiveClassesPublicPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live-classes")
      .then((r) => r.json())
      .then((j) => setData(j.data ?? null))
      .finally(() => setLoading(false));
  }, []);

  const featured = data?.featured ?? null;
  const upcoming = (data?.upcoming ?? []).filter((l) => !featured || l.id !== featured.id);

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />

      <PageHero
        kicker="Live Classes"
        title={
          <>
            Learn Live With <span className="text-primary">Real Experts</span>
          </>
        }
        subtitle="Interactive real-time sessions with industry professionals — ask questions, get feedback and level up faster."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Live Classes" }]}
      />

      <PageBand tone="live">
        <Container>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading live classes...</p>
          ) : !data?.all.length ? (
            <p className="text-center text-muted-foreground">No live classes scheduled yet. Check back soon.</p>
          ) : (
            <>
              {featured && (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
                    <div className="relative aspect-video bg-gradient-to-br from-primary/80 to-primary/40">
                      {featured.status === "live" && (
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                          <Radio className="h-3 w-3" /> LIVE NOW
                        </span>
                      )}
                      {featured.joinUrl ? (
                        <a
                          href={featured.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-card text-ink shadow-card"
                        >
                          <Play className="h-6 w-6 fill-current" />
                        </a>
                      ) : (
                        <div className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-card text-ink shadow-card">
                          <Video className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                        {featured.status === "live" ? "Live Session" : "Featured Session"}
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-ink">{featured.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Hosted by {featured.instructorName}
                        {featured.courseTitle ? ` · ${featured.courseTitle}` : ""}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> {formatSchedule(featured.scheduledAt).date}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {formatSchedule(featured.scheduledAt).time} IST
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> {featured.enrolled} attending
                        </span>
                      </div>
                      <div className="mt-6 flex gap-3">
                        {featured.joinUrl ? (
                          <a
                            href={featured.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                          >
                            {featured.status === "live" ? "Join Now" : "Join Session"}
                          </a>
                        ) : (
                          <span className="rounded-full bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground">
                            Link coming soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {upcoming.length > 0 && (
                <>
                  <div className="mt-10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-ink">Upcoming Sessions</h2>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((l, i) => {
                      const sched = formatSchedule(l.scheduledAt);
                      return (
                        <div
                          key={l.id}
                          className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:border-primary/60"
                        >
                          <div className={`relative aspect-video bg-gradient-to-br ${GRADS[i % GRADS.length]}`}>
                            {l.status === "live" && (
                              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                <Radio className="h-3 w-3" /> LIVE
                              </span>
                            )}
                            <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-card/90 text-ink shadow-card">
                              <Video className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="text-base font-bold text-ink">{l.title}</div>
                            <div className="text-[11px] text-muted-foreground">By {l.instructorName}</div>
                            {l.courseTitle && (
                              <div className="mt-1 text-[10px] text-primary">{l.courseTitle}</div>
                            )}
                            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {sched.date}</span>
                              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {sched.time}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Users className="h-3 w-3" /> {l.enrolled} enrolled
                              </span>
                              {l.joinUrl ? (
                                <a
                                  href={l.joinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
                                >
                                  {l.status === "live" ? "Join" : "Reserve"} <ArrowRight className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Soon</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </Container>
      </PageBand>

      <SiteFooter />
    </div>
  );
}
