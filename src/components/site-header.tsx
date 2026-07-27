"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Search,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  ShoppingBag,
  User,
  LogOut,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { images } from "@/lib/images";
import { cn } from "@/lib/utils";
import { getCartCount, onCartChange } from "@/lib/cart/cart-store";
import { getStudentSession, logoutStudent, syncSessionFromServer } from "@/lib/exam/student-session";

const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Live Classes", href: "/live-classes" },
  { label: "Instructors", href: "/instructors" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export function SiteTopBar() {
  return (
    <div className="hidden border-b border-border/80 bg-forest text-white/90 lg:block">
      <Container className="flex h-10 items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-white/80" />
          <span>
            New Year Offer! Get up to <b className="text-white">50% OFF</b> on all courses.
          </span>
          <a href="#" className="ml-1 inline-flex items-center gap-1 font-semibold text-white hover:underline">
            Enroll Now <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <div className="flex items-center gap-6">
          <a className="inline-flex items-center gap-2 hover:text-white" href="tel:+911234567890">
            <Phone className="h-3.5 w-3.5" /> +91 12345 67890
          </a>
          <a
            className="inline-flex items-center gap-2 hover:text-white"
            href="mailto:support@navbharatgurukulam.com"
          >
            <Mail className="h-3.5 w-3.5" /> support@navbharatgurukulam.com
          </a>
          <div className="flex items-center gap-3 text-white/70">
            {[Facebook, Twitter, Instagram, Youtube].map((Ic, i) => (
              <a key={i} href="#" className="hover:text-white">
                <Ic className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [student, setStudent] = useState<ReturnType<typeof getStudentSession>>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setCartCount(getCartCount());
      setStudent(getStudentSession());
    };
    refresh();
    syncSessionFromServer().then(() => refresh());
    return onCartChange(refresh);
  }, []);

  useEffect(() => {
    const onAuth = () => setStudent(getStudentSession());
    window.addEventListener("nbg-auth-change", onAuth);
    return () => window.removeEventListener("nbg-auth-change", onAuth);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all",
        scrolled ? "border-border bg-card/95 shadow-card backdrop-blur-md" : "border-border/60 bg-card",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-3 sm:h-[72px]">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2.5 sm:gap-3">
          <img
            src={images.logo}
            alt="Navbharat Gurukulam Research Foundation"
            className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-extrabold tracking-tight text-ink sm:text-base">
              Navbharat Gurukulam
            </span>
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-primary sm:block">
              Research Foundation
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.label}
                href={n.href}
                className={cn(
                  "relative inline-flex items-center gap-1 text-[13px] font-semibold transition-colors",
                  active ? "text-maroon" : "text-foreground/75 hover:text-primary",
                )}
              >
                {n.label}
                {n.label === "Courses" && <ChevronDown className="h-3.5 w-3.5 opacity-50" />}
                {active && (
                  <span className="absolute -bottom-[22px] left-0 right-0 h-0.5 rounded-full bg-maroon" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <button className="hidden h-9 w-9 place-items-center rounded-lg text-foreground/60 hover:bg-muted hover:text-primary md:grid">
            <Search className="h-4 w-4" />
          </button>
          <Link
            href="/cart"
            className="relative hidden h-9 w-9 place-items-center rounded-lg text-foreground/60 hover:bg-muted hover:text-primary md:grid"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-maroon px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          {student ? (
            <>
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-foreground/80 hover:text-primary md:inline-flex"
              >
                <User className="h-4 w-4" />
                {student.name.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={() => logoutStudent().then(() => setStudent(null))}
                className="hidden items-center gap-1 rounded-md border border-maroon/30 px-3 py-2 text-[13px] font-semibold text-maroon hover:bg-maroon/5 md:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="hidden rounded-md border border-maroon/30 px-4 py-2 text-[13px] font-semibold text-maroon hover:bg-maroon/5 md:inline-flex"
              >
                Login
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(pathname)}`}
                className="hidden rounded-md bg-maroon px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95 md:inline-flex"
              >
                Sign Up
              </Link>
            </>
          )}
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </Container>
      {open && (
        <div className="border-t border-border bg-card lg:hidden">
          <Container className="grid gap-1 py-4">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/cart" className="flex-1 rounded-md border border-border px-4 py-2.5 text-center text-sm font-semibold" onClick={() => setOpen(false)}>
                Cart ({cartCount})
              </Link>
              {student ? (
                <Link href="/dashboard" className="flex-1 rounded-md bg-maroon px-4 py-2.5 text-center text-sm font-semibold text-white" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname)}`}
                    className="flex-1 rounded-md border border-maroon/30 px-4 py-2.5 text-center text-sm font-semibold text-maroon"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href={`/signup?next=${encodeURIComponent(pathname)}`}
                    className="flex-1 rounded-md bg-maroon px-4 py-2.5 text-center text-sm font-semibold text-white"
                    onClick={() => setOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
