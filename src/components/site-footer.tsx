"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NewsletterSubscribeForm } from "@/components/newsletter/newsletter-subscribe-form";
import { images } from "@/lib/images";
import { cn } from "@/lib/utils";

const cols: { t: string; l: { label: string; href?: string }[] }[] = [
  {
    t: "Quick Links",
    l: [
      { label: "About Us", href: "/about" },
      { label: "Courses", href: "/courses" },
      { label: "Instructors", href: "/instructors" },
      { label: "Live Classes", href: "/live-classes" },
      { label: "Blog", href: "/blog" },
      { label: "Gallery", href: "/gallery" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    t: "For Learners",
    l: [
      { label: "My Courses", href: "/dashboard" },
      { label: "My Certificates", href: "/dashboard" },
      { label: "Pricing", href: "/pricing" },
      { label: "Exams", href: "/exams" },
      { label: "Cart", href: "/cart" },
      { label: "Student Dashboard", href: "/dashboard" },
    ],
  },
  {
    t: "For Instructors",
    l: [
      { label: "Become an Instructor", href: "/contact" },
      { label: "Instructor Dashboard", href: "/instructor-dashboard" },
      { label: "Create Course", href: "/admin/courses/new" },
      { label: "Live Classes", href: "/admin/live-classes" },
      { label: "Quizzes", href: "/instructor-dashboard/quizzes" },
    ],
  },
  {
    t: "Support",
    l: [
      { label: "Help Center", href: "/contact" },
      { label: "FAQs", href: "/faq" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Refund Policy", href: "/terms" },
      { label: "Contact Support", href: "/contact" },
    ],
  },
];

function FooterLinkList({ links }: { links: { label: string; href?: string }[] }) {
  return (
    <ul className="space-y-1 pb-3 pt-1 text-sm lg:space-y-2.5 lg:pb-0 lg:pt-0">
      {links.map((x) => (
        <li key={x.label}>
          {x.href ? (
            <Link
              href={x.href}
              className="inline-block rounded-md py-1.5 text-white/75 transition hover:text-white lg:py-0.5"
            >
              {x.label}
            </Link>
          ) : (
            <a href="#" className="inline-block rounded-md py-1.5 text-white/75 transition hover:text-white lg:py-0.5">
              {x.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function FooterAccordionColumn({
  title,
  links,
  open,
  onToggle,
}: {
  title: string;
  links: { label: string; href?: string }[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="lg:block">
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors lg:hidden",
          open ? "text-white" : "text-white/90",
        )}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold tracking-wide">{title}</span>
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/5 text-white/70 transition-all duration-300",
            open && "rotate-180 bg-white/10 text-white",
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      <p className="hidden text-sm font-bold text-white lg:block">{title}</p>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out lg:mt-4 lg:grid-rows-[1fr]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden lg:overflow-visible">
          <div className="pb-1 pl-1 lg:pb-0 lg:pl-0">
            <FooterLinkList links={links} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <footer className="bg-forest text-white/80">
      {/* Newsletter band */}
      <div className="border-b border-white/10 bg-forest">
        <Container className="flex flex-col items-center gap-5 py-8 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
              <Mail className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-bold text-white">Stay Updated with Our Latest News</p>
              <p className="mt-0.5 text-sm text-white/70">Subscribe for courses, research updates & offers</p>
            </div>
          </div>
          <div className="w-full sm:max-w-md sm:shrink-0">
            <NewsletterSubscribeForm />
          </div>
        </Container>
      </div>

      <Container className="pt-10 pb-8 sm:pt-12">
        <div className="grid gap-8 pb-8 sm:gap-10 sm:pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] lg:gap-10">
          <div className="text-center sm:text-left">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img
                src={images.logo}
                alt="Navbharat Gurukulam Research Foundation"
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <span className="leading-tight text-left">
                <span className="block text-base font-extrabold text-white">Navbharat Gurukulam</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Research Foundation
                </span>
              </span>
            </Link>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/70 sm:mx-0">
              Empowering learners worldwide with quality education and practical skills to achieve
              their dreams.
            </p>
            <div className="mt-4 flex justify-center gap-2 sm:justify-start">
              {[Facebook, Twitter, Linkedin, Youtube, Instagram].map((Ic, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  <Ic className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col divide-y divide-white/8 border-t border-white/8 pt-1 lg:contents lg:divide-none lg:border-0 lg:pt-0">
            {cols.map((col) => (
              <FooterAccordionColumn
                key={col.t}
                title={col.t}
                links={col.l}
                open={!!openSections[col.t]}
                onToggle={() => toggleSection(col.t)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-center text-xs text-white/50 sm:flex-row sm:items-center sm:text-left">
          <p>© 2026 Navbharat Gurukulam Research Foundation. All Rights Reserved.</p>
          <p>Designed with care for Education & Research</p>
        </div>
      </Container>
    </footer>
  );
}
