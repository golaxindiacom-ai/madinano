import Link from "next/link";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

type PageHeroProps = {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  align?: "center" | "left";
  children?: React.ReactNode;
  className?: string;
};

export function PageHero({
  kicker = "Navbharat Gurukulam",
  title,
  subtitle,
  breadcrumbs,
  align = "center",
  children,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("bg-hero-soft py-12 sm:py-16", className)}>
      <Container
        className={cn(align === "center" ? "text-center" : "text-left")}
      >
        {breadcrumbs?.length ? (
          <div
            className={cn(
              "mb-5 text-xs text-muted-foreground",
              align === "center" && "mx-auto",
            )}
          >
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`}>
                {index > 0 ? <span className="mx-1.5">›</span> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-primary">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
          {kicker}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base",
              align === "center" && "mx-auto",
            )}
          >
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </Container>
    </section>
  );
}

/** Soft content band matching home section rhythm */
export function PageBand({
  tone = "courses",
  className,
  children,
}: {
  tone?:
    | "trusted"
    | "courses"
    | "why"
    | "categories"
    | "process"
    | "live"
    | "instructors"
    | "testimonials"
    | "app"
    | "blog"
    | "faq";
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    trusted: "bg-home-trusted",
    courses: "bg-home-courses",
    why: "bg-home-why",
    categories: "bg-home-categories",
    process: "bg-home-process",
    live: "bg-home-live",
    instructors: "bg-home-instructors",
    testimonials: "bg-home-testimonials",
    app: "bg-home-app",
    blog: "bg-home-blog",
    faq: "bg-home-faq",
  };

  return (
    <section className={cn(tones[tone], "py-10 sm:py-14", className)}>
      {children}
    </section>
  );
}
