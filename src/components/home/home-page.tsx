"use client";

import { SiteTopBar, SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { images } from "@/lib/images";
import type {
  FaqItem,
  HomeCmsContent,
  HomePagePayload,
  PublicBlogCard,
  PublicCourseCard as PublicCourseCardType,
  PublicInstructorCard as PublicInstructorCardType,
  PublicLiveClassItem,
  Testimonial,
} from "@/lib/admin/types";
import { DEFAULT_HOME_CMS } from "@/lib/certificate-settings";
import { cn } from "@/lib/utils";
import { PublicCourseCard } from "@/components/course/public-course-card";
import { PublicInstructorCard } from "@/components/course/public-instructor-card";
import { useEffect, useState } from "react";
import {
  Sparkles, Facebook, Instagram, Twitter, Youtube, Linkedin,
  Search, ChevronDown, ArrowRight, Play, Star, Award, GraduationCap,
  Code2, Palette, BarChart3, Briefcase, Smartphone, Database, Megaphone,
  Users, BookOpen, Clock, Heart, ShoppingCart, Video, FileText, FolderKanban,
  Rocket, ShieldCheck, Infinity as InfinityIcon, MessageCircle, Quote,
  TrendingUp, Apple, PlayCircle, ShoppingBag, MoreHorizontal,
  Globe, Trophy, Headphones, ChevronRight, FlaskConical, Scale, HeartPulse,
} from "lucide-react";

const categoryIcons = [
  { i: FlaskConical, fg: "text-primary", bg: "bg-primary/10" },
  { i: Scale, fg: "text-maroon", bg: "bg-maroon/10" },
  { i: GraduationCap, fg: "text-primary", bg: "bg-primary/10" },
  { i: Code2, fg: "text-maroon", bg: "bg-maroon/10" },
  { i: Briefcase, fg: "text-primary", bg: "bg-primary/10" },
  { i: HeartPulse, fg: "text-maroon", bg: "bg-maroon/10" },
  { i: Palette, fg: "text-primary", bg: "bg-primary/10" },
  { i: Megaphone, fg: "text-maroon", bg: "bg-maroon/10" },
];

function count(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(".0", "")}K+` : `${value}+`;
}

const PLACEHOLDER_STATS: HomePagePayload["stats"] = {
  students: 0,
  instructors: 0,
  courses: 0,
  certificates: 0,
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/70", className)} />;
}

function SectionHeadingSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
    </div>
  );
}

function HomeCoursesSkeleton() {
  return (
    <section className="bg-home-courses py-12 md:py-16">
      <Container>
        <SectionHeadingSkeleton />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </Container>
    </section>
  );
}

function HomeCategoriesSkeleton() {
  return (
    <section className="bg-home-categories py-12 md:py-16 lg:py-20">
      <Container>
        <SectionHeadingSkeleton />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </Container>
    </section>
  );
}

function HomeLiveClassesSkeleton() {
  return (
    <section className="bg-home-live py-12 md:py-16 lg:py-20">
      <Container>
        <div className="grid gap-8 rounded-2xl border border-border/50 bg-card/70 p-5 sm:rounded-3xl sm:p-8 lg:grid-cols-[1fr_2fr] lg:p-14">
          <div className="space-y-4 self-center">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-11 w-40 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function HomeInstructorsSkeleton() {
  return (
    <section className="bg-home-instructors py-12 md:py-16 lg:py-20">
      <Container>
        <SectionHeadingSkeleton />
        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </Container>
    </section>
  );
}

function HomeTestimonialsSkeleton() {
  return (
    <section className="bg-home-testimonials py-12 md:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto mt-2 h-4 w-80 max-w-full" />
        </div>
        <div className="mt-8 flex gap-4 overflow-hidden sm:mt-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-80 shrink-0 rounded-2xl" />
          ))}
        </div>
      </Container>
    </section>
  );
}

function HomeBlogSkeleton() {
  return (
    <section className="bg-home-blog py-12 md:py-16 lg:py-20">
      <Container>
        <SectionHeadingSkeleton />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </Container>
    </section>
  );
}

function HomeFaqSkeleton() {
  return (
    <section className="bg-home-faq py-12 md:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto mt-2 h-4 w-72 max-w-full" />
        </div>
        <div className="mx-auto mt-8 max-w-3xl space-y-3 sm:mt-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </Container>
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLiveSchedule(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const time = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ---------- Shared ---------- */
const SectionTitle = ({ title, subtitle, align = "center" }: { title: React.ReactNode; subtitle?: string; align?: "center" | "left" }) => (
  <div className={`max-w-2xl px-1 ${align === "center" ? "mx-auto text-center" : ""}`}>
    <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">{title}</h2>
    {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">{subtitle}</p>}
  </div>
);

/* ---------- Hero ---------- */
const Hero = ({
  stats,
  cms,
  statsLoading = false,
}: {
  stats: HomePagePayload["stats"];
  cms?: HomeCmsContent;
  statsLoading?: boolean;
}) => {
  const hero = cms ?? DEFAULT_HOME_CMS;

  return (
  <section className="relative overflow-hidden">
    {/* Full-bleed hero banner (student + faded monument + warm cream) */}
    <div className="absolute inset-0 bg-[oklch(0.97_0.02_60)]">
      <img
        src={images.heroBanner}
        alt="Student at Madinano"
        className="absolute inset-0 h-full w-full object-cover object-[75%_center] sm:object-[70%_center] md:object-center"
      />
      {/* strengthen the cream on the left so the headline stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.97_0.02_60)] from-0% via-[oklch(0.97_0.02_60)/0.85] via-45% to-transparent to-90% sm:from-25% sm:via-50% sm:to-80%" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent sm:from-background/85 sm:via-transparent" />
    </div>

    {/* Top-right official crest logo */}
    <div className="absolute right-3 top-4 z-20 sm:right-6 sm:top-6 md:right-8 md:top-8">
      <img
        src={images.logo}
        alt="Madinano logo"
        className="h-14 w-14 object-contain drop-shadow-lg sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24"
      />
    </div>

    <Container className="relative z-10 flex min-h-[420px] items-center py-10 sm:min-h-[500px] sm:py-14 md:min-h-[560px] lg:min-h-[600px] lg:py-20">
      <div className="min-w-0 max-w-xl pr-16 sm:pr-20 md:pr-0">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-maroon/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-maroon sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px]">
          <Sparkles className="h-3 w-3 shrink-0" /> {hero.heroKicker}
        </span>
        <h1 className="mt-4 text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-ink sm:mt-5 sm:text-4xl sm:leading-[1.1] md:text-5xl lg:text-[56px]">
          {hero.heroTitleLine1}<br />
          through <span className="text-maroon">{hero.heroHighlight1}</span><br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          {hero.heroTitleLine2} <span className="text-maroon">{hero.heroHighlight2}</span>
        </h1>
        <p className="mt-4 max-w-md text-[13px] leading-relaxed text-muted-foreground sm:mt-5 sm:text-sm md:text-base">
          {hero.heroSubtitle}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
          <a href={hero.primaryCtaHref || "/courses"} className="inline-flex items-center justify-center gap-2 rounded-lg bg-maroon px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 sm:justify-start sm:px-6 sm:py-3.5">
            {hero.primaryCtaLabel || "Explore Courses"} <ArrowRight className="h-4 w-4" />
          </a>
          <a href={hero.secondaryCtaHref || "/about"} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card/90 px-5 py-3 text-sm font-bold text-ink backdrop-blur-sm transition hover:border-maroon/40 sm:justify-start sm:px-6 sm:py-3.5">
            <PlayCircle className="h-4 w-4 shrink-0 text-maroon" /> {hero.secondaryCtaLabel || "Learn More"} <ChevronDown className="hidden h-4 w-4 sm:block" />
          </a>
        </div>
      </div>
    </Container>

    {/* Floating pill search bar overlapping the bottom edge */}
    <Container className="relative z-20">
      <form className="mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-float sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-6 md:-mb-8 md:translate-y-8">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 sm:justify-start sm:border-b-0 sm:border-r sm:py-1 sm:pr-5">
          <span className="truncate text-sm font-semibold text-ink">All Categories</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:px-4">
          <input placeholder="Search for courses, programs, research." className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-muted-foreground" />
        </div>
        <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-maroon px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 sm:rounded-full sm:px-7">
          <Search className="h-4 w-4" /> Search
        </button>
      </form>
    </Container>

    {/* Stats strip */}
    <div className="mt-6 border-b border-border bg-card pt-4 sm:mt-0 sm:pt-6 md:pt-8">
      <Container className="grid grid-cols-2 gap-x-4 gap-y-5 py-5 sm:gap-4 sm:py-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border">
        {[
          { i: Users, v: count(stats.students), l: "Students Enrolled", c: "text-primary" },
          { i: GraduationCap, v: count(stats.instructors), l: "Expert Instructors", c: "text-maroon" },
          { i: BookOpen, v: count(stats.courses), l: "Courses & Programs", c: "text-primary" },
          { i: Award, v: count(stats.certificates), l: "Certificates Issued", c: "text-maroon" },
        ].map(({ i: Icon, v, l, c }) => (
          <div key={l} className="flex items-center gap-2.5 px-1 sm:gap-3 sm:px-2 lg:px-6">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted sm:h-10 sm:w-10 ${c}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              {statsLoading ? (
                <>
                  <Skeleton className="h-6 w-14 sm:h-7 md:h-8" />
                  <Skeleton className="mt-1.5 h-3 w-24" />
                </>
              ) : (
                <>
                  <p className="text-base font-extrabold text-ink sm:text-lg md:text-xl">{v}</p>
                  <p className="text-[10px] leading-tight text-muted-foreground sm:text-[11px]">{l}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </Container>
    </div>
  </section>
  );
};

/* ---------- Trusted By ---------- */
const brands = ["Google", "Microsoft", "AWS", "LinkedIn", "Coursera", "ESRI", "Adobe", "IBM", "Meta"];
const TrustedBy = () => (
  <section className="border-y border-border/60 bg-home-trusted py-10">
    <Container>
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Trusted by teams and universities in 90+ countries
      </p>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#f3e8d8] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f3e8d8] to-transparent" />
        <div className="flex animate-marquee gap-16 whitespace-nowrap">
          {[...brands, ...brands].map((b, i) => (
            <span key={i} className="text-2xl font-extrabold tracking-tight text-ink/30">{b}</span>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

/* ---------- Categories ---------- */
const Categories = ({ categories }: { categories: HomePagePayload["categories"] }) => {
  if (!categories.length) return null;

  return (
    <section className="bg-home-categories py-12 md:py-16 lg:py-20">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Browse Top Categories
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore our diverse range of academic programs.
            </p>
          </div>
          <a
            href="/courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            View All Categories <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {categories.map((cat, idx) => {
            const { i: Icon, fg, bg } = categoryIcons[idx % categoryIcons.length];
            return (
              <a
                key={cat.id}
                href={`/courses?categoryId=${cat.id}`}
                className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-border bg-card px-4 py-6 text-center transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-float"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl ${bg} ${fg} transition group-hover:scale-105`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <p className="mt-4 line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-primary">
                  {cat.name}
                </p>
                <p className="mt-2 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {cat.courseCount} {cat.courseCount === 1 ? "Course" : "Courses"}
                </p>
              </a>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

/* ---------- Featured Courses ---------- */
const PopularCourses = ({ featuredCourses }: { featuredCourses: PublicCourseCardType[] }) => (
  <section className="bg-home-courses py-12 md:py-16">
    <Container>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Explore Our Popular Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Handpicked programs for research & career growth</p>
        </div>
        <a href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          View All Courses <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {featuredCourses.slice(0, 4).map((c) => (
          <PublicCourseCard key={c.id} course={c} />
        ))}
      </div>
    </Container>
  </section>
);

/* ---------- Why Choose ---------- */
const features = [
  { i: GraduationCap, t: "Quality Education", d: "Industry-aligned curriculum designed by expert educators and professionals.", fg: "text-primary" },
  { i: FlaskConical, t: "Research Driven", d: "Encouraging innovative research and practical solutions for real-world challenges.", fg: "text-primary" },
  { i: Users, t: "Expert Faculty", d: "Learn from experienced faculty, researchers and subject-matter experts.", fg: "text-primary" },
  { i: Rocket, t: "Modern Learning", d: "Access to modern learning resources and advanced technologies.", fg: "text-primary" },
  { i: Award, t: "Certification", d: "Recognized certificates to boost your skills and career.", fg: "text-primary" },
  { i: Headphones, t: "Student Support", d: "Dedicated support team to help you achieve your academic goals.", fg: "text-primary" },
];

const WhyUs = () => (
  <section className="bg-home-why py-12 md:py-16 lg:py-20">
    <Container>
      <SectionTitle title="Why Madinano?" subtitle="Excellence in education and research since inception." />
      <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {features.map(({ i: Icon, t, d, fg }) => (
          <div key={t} className="rounded-lg border border-border bg-card p-6 transition hover:shadow-card">
            <span className={`grid h-11 w-11 place-items-center rounded-lg bg-muted ${fg}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-base font-bold text-ink">{t}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

/* ---------- Learning Process ---------- */
const steps = [
  { n: "01", i: BookOpen, t: "Choose a Course", d: "Browse and select from our wide range of courses." },
  { n: "02", i: GraduationCap, t: "Enroll & Learn", d: "Enroll in your chosen course and start learning." },
  { n: "03", i: FileText, t: "Engage & Study", d: "Engage with content, complete assignments and quizzes." },
  { n: "04", i: Award, t: "Get Certified", d: "Complete the course and earn your certification." },
];
const Process = () => (
  <section className="bg-home-process py-12 md:py-16 lg:py-20">
    <Container>
      <SectionTitle title="Your Learning Journey in 4 Simple Steps" subtitle="From enrollment to certification — a clear path to success." />
      <div className="relative mt-10 sm:mt-14">
        <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px border-t-2 border-dashed border-primary/30 lg:block" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, i: Icon, t, d }, idx) => (
            <div key={n} className="relative text-center">
              <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-sm font-bold text-white ${idx % 2 === 0 ? "bg-primary" : "bg-maroon"}`}>
                {n}
              </span>
              <span className={`mx-auto mt-4 grid h-12 w-12 place-items-center rounded-full ${idx % 2 === 0 ? "bg-primary/10 text-primary" : "bg-maroon/10 text-maroon"}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-bold text-ink">{t}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

/* ---------- Live Classes ---------- */
const LiveClasses = ({ liveClasses }: { liveClasses: PublicLiveClassItem[] }) => (
  <section className="bg-home-live py-12 md:py-16 lg:py-20">
    <Container>
      <div className="grid gap-8 rounded-2xl border border-border/50 bg-card/70 p-5 shadow-card backdrop-blur-sm sm:gap-12 sm:rounded-3xl sm:p-8 lg:grid-cols-[1fr_2fr] lg:p-14">
        <div className="self-center text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-rose-500 shadow-card">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> LIVE
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-tight text-ink sm:mt-5 sm:text-3xl md:text-4xl">
            Join Live Classes with <br className="hidden sm:block" /> Industry Experts
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Participate in interactive live sessions, ask questions and learn from the best in real time.
          </p>
          <a href="/live-classes" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-card px-5 py-3 text-sm font-semibold text-primary shadow-card hover:bg-primary hover:text-white sm:mt-6 sm:w-auto lg:inline-flex">
            View Live Classes <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {liveClasses.slice(0, 3).map((l) => (
            <article key={l.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-maroon/20 to-primary/20">
                <div className="absolute inset-0 grid place-items-center bg-black/20">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-card text-primary shadow-float">
                    <Play className="h-4 w-4 pl-0.5" />
                  </span>
                </div>
                <span className="absolute left-3 top-3 rounded-md bg-card/95 px-2 py-1 text-[11px] font-bold text-ink">
                  {formatLiveSchedule(l.scheduledAt)}
                </span>
                {l.status === "live" && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-rose-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-bold leading-snug text-ink">{l.title}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {initials(l.instructorName)}
                  </span>
                  <span className="text-xs text-muted-foreground">by {l.instructorName}</span>
                </div>
                {l.courseTitle && (
                  <span className="mt-3 inline-block rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">{l.courseTitle}</span>
                )}
                {l.joinUrl ? (
                  <a href={l.joinUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white">
                    Join Now <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-semibold text-muted-foreground">
                    {l.platformLabel}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

/* ---------- Instructors ---------- */
const Instructors = ({ instructors }: { instructors: PublicInstructorCardType[] }) => {
  if (!instructors.length) return null;

  return (
    <section className="bg-home-instructors py-12 md:py-16 lg:py-20">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Meet Our Expert Instructors
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn from experienced researchers and educators.
            </p>
          </div>
          <a href="/instructors" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            View All Instructors <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {instructors.slice(0, 3).map((instructor) => (
            <PublicInstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </div>
      </Container>
    </section>
  );
};

/* ---------- Testimonials ---------- */
const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
  if (!testimonials.length) return null;
  const loop = [...testimonials, ...testimonials];

  return (
    <section className="overflow-hidden bg-home-testimonials py-12 md:py-16 lg:py-20">
      <Container>
        <SectionTitle
          title="What Our Students Say"
          subtitle="Real feedback from learners who have transformed their careers."
        />
      </Container>

      <div className="relative mt-8 sm:mt-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#e6f0f4] to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#e6f0f4] to-transparent sm:w-20" />

        <div className="flex w-max animate-marquee gap-5 pe-5 hover:[animation-play-state:paused] sm:gap-6 sm:pe-6 [animation-duration:45s]">
          {loop.map((t, index) => (
            <figure
              key={`${t.id}-${index}`}
              className="relative flex w-[min(88vw,360px)] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card sm:w-[380px] sm:p-7"
            >
              <div className="absolute -right-2 -top-2 text-primary/10">
                <Quote className="h-16 w-16 rotate-180 fill-current" />
              </div>

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < t.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/25"
                      }`}
                    />
                  ))}
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Verified
                </span>
              </div>

              <blockquote className="relative mt-4 flex-1 text-[15px] leading-relaxed text-foreground/85">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <figcaption className="relative mt-6 flex items-center gap-3 border-t border-border pt-4">
                {t.avatarUrl ? (
                  <img
                    src={t.avatarUrl}
                    alt={t.name}
                    className="h-12 w-12 rounded-full object-cover object-top ring-2 ring-primary/15"
                  />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/15">
                    {initials(t.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- Mobile App ---------- */
const MobileApp = () => (
  <section className="bg-home-app py-12 md:py-16 lg:py-20">
    <Container>
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12 md:px-14 md:py-14 lg:grid-cols-2 lg:gap-12">
        <div className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide">
            Mobile App
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
            Learn Anywhere with Our Mobile App
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80 sm:mt-4 sm:text-base">
            Download our app and learn on the go. Available for both Android and iOS devices with full offline mode.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-white px-5 text-ink shadow-sm transition hover:bg-white/95"
            >
              <Apple className="h-7 w-7 shrink-0" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-ink/60">Download on the</span>
                <span className="block text-sm font-bold">App Store</span>
              </span>
            </a>
            <a
              href="#"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-white px-5 text-ink shadow-sm transition hover:bg-white/95"
            >
              <PlayCircle className="h-7 w-7 shrink-0 text-primary" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-ink/60">Get it on</span>
                <span className="block text-sm font-bold">Google Play</span>
              </span>
            </a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-2xl bg-white/10 p-2 sm:rounded-3xl sm:p-3">
            <img
              src={images.heroStudent}
              alt="Student learning on mobile"
              loading="lazy"
              className="aspect-[4/5] w-full rounded-xl object-cover object-center sm:rounded-2xl"
            />
          </div>
        </div>
      </div>
    </Container>
  </section>
);

/* ---------- Blog ---------- */
const Blog = ({ blogs }: { blogs: PublicBlogCard[] }) => (
  <section className="bg-home-blog py-12 md:py-16 lg:py-20">
    <Container>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Latest Articles & Insights</h2>
          <p className="mt-1 text-sm text-muted-foreground">Stay updated with the latest in education and research.</p>
        </div>
        <a href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          View All Articles <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {blogs.slice(0, 3).map((p) => (
          <a key={p.id} href="/blog" className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-float">
            <div className="aspect-[16/10] overflow-hidden">
              {p.coverImage ? (
                <img src={p.coverImage} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="grid h-full place-items-center bg-gradient-to-br from-maroon/20 to-primary/20">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">{p.category}</span>
                <span>{formatDate(p.publishedAt)}</span>
                <span>·</span>
                <span>{p.readTime}</span>
              </div>
              <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug text-ink group-hover:text-primary">{p.title}</h3>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Read More <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </Container>
  </section>
);

/* ---------- FAQ ---------- */
const FAQ = ({ faqs }: { faqs: FaqItem[] }) => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-home-faq py-12 md:py-16 lg:py-20">
      <Container>
        <SectionTitle title="Frequently Asked Questions" subtitle="Everything you need to know before you start learning." />
        <div className="mx-auto mt-8 max-w-3xl space-y-3 sm:mt-10">
          {faqs.map((f, i) => {
            const active = open === i;
            return (
              <button key={f.id} onClick={() => setOpen(active ? null : i)}
                className={`w-full rounded-xl border bg-card p-4 text-left transition sm:p-5 ${active ? "border-primary/40 shadow-card" : "border-border hover:border-border/80"}`}>
                <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
                  <span className="text-left text-sm font-bold text-ink sm:text-base">{f.question}</span>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-lg font-bold transition ${active ? "rotate-45 bg-primary text-primary-foreground" : "bg-muted text-ink"}`}>+</span>
                </div>
                {active && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>}
              </button>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

/* ---------- Home ---------- */
export default function HomePage() {
  const [data, setData] = useState<HomePagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/home", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load home page");
        const payload = await response.json();
        if (!payload.success) throw new Error("Could not load home page");
        setData(payload.data);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError("Some sections could not be loaded. Please refresh to try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const ready = !loading && !!data;

  return (
    <main className="overflow-x-hidden bg-background pb-20 text-foreground sm:pb-0">
      <SiteTopBar />
      <SiteHeader />
      <Hero
        stats={data?.stats ?? PLACEHOLDER_STATS}
        cms={data?.cms ?? DEFAULT_HOME_CMS}
        statsLoading={loading}
      />
      {error && !ready ? (
        <div className="border-b border-destructive/20 bg-destructive/5 py-3 text-center text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <TrustedBy />
      {ready ? (
        <>
          <PopularCourses featuredCourses={data.featuredCourses} />
          <WhyUs />
          <Categories categories={data.categories} />
          <Process />
          <LiveClasses liveClasses={data.liveClasses} />
          <Instructors instructors={data.instructors} />
          <Testimonials testimonials={data.testimonials} />
          <MobileApp />
          <Blog blogs={data.blogs} />
          <FAQ faqs={data.faqs} />
        </>
      ) : (
        <>
          <HomeCoursesSkeleton />
          <WhyUs />
          <HomeCategoriesSkeleton />
          <Process />
          <HomeLiveClassesSkeleton />
          <HomeInstructorsSkeleton />
          <HomeTestimonialsSkeleton />
          <MobileApp />
          <HomeBlogSkeleton />
          <HomeFaqSkeleton />
        </>
      )}
      <SiteFooter />
      <a href="#" aria-label="WhatsApp" className="fixed bottom-4 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-float hover:scale-105 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14">
        <MessageCircle className="h-6 w-6" />
      </a>
    </main>
  );
}
