import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NewsletterSubscribeForm } from "@/components/newsletter/newsletter-subscribe-form";
import { images } from "@/lib/images";

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

export function SiteFooter() {
  return (
    <footer className="bg-forest text-white/80">
      {/* Newsletter band */}
      <div className="border-b border-white/10 bg-forest">
        <Container className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
              <Mail className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-bold text-white">Stay Updated with Our Latest News</p>
              <p className="text-sm text-white/70">Subscribe for courses, research updates & offers</p>
            </div>
          </div>
          <NewsletterSubscribeForm />
        </Container>
      </div>

      <Container className="pt-12 pb-8">
        <div className="grid gap-10 pb-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src={images.logo}
                alt="Navbharat Gurukulam Research Foundation"
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <span className="leading-tight">
                <span className="block text-base font-extrabold text-white">Navbharat Gurukulam</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Research Foundation
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Empowering learners worldwide with quality education and practical skills to achieve
              their dreams.
            </p>
            <div className="mt-4 flex gap-2">
              {[Facebook, Twitter, Linkedin, Youtube, Instagram].map((Ic, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                >
                  <Ic className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.t}>
              <p className="text-sm font-bold text-white">{col.t}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.l.map((x) => (
                  <li key={x.label}>
                    {x.href ? (
                      <Link href={x.href} className="hover:text-white">
                        {x.label}
                      </Link>
                    ) : (
                      <a href="#" className="hover:text-white">
                        {x.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© 2026 Navbharat Gurukulam Research Foundation. All Rights Reserved.</p>
          <p>Designed with care for Education & Research</p>
        </div>
      </Container>
    </footer>
  );
}
