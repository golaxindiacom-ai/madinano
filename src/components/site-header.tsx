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

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

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
            href="mailto:support@madinano.com"
          >
            <Mail className="h-3.5 w-3.5" /> support@madinano.com
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [student, setStudent] = useState<ReturnType<typeof getStudentSession>>(null);

  useBodyScrollLock(drawerOpen);

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

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all",
          scrolled ? "border-border bg-card/95 shadow-card backdrop-blur-md" : "border-border/60 bg-card",
        )}
      >
        <Container className="flex h-14 items-center justify-between gap-2 sm:h-16 md:h-[72px] md:gap-3">
          <div className="flex min-w-0 items-center gap-2 lg:gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm hover:bg-muted lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5 md:gap-3">
              <img
                src={images.logo}
                alt="Madinano Global Pvt. Ltd."
                className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-11 sm:w-11 md:h-12 md:w-12"
              />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-extrabold tracking-tight text-ink sm:text-[15px] md:text-base">
                  Madinano
                </span>
                <span className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-primary sm:block">
                  Global Pvt. Ltd.
                </span>
              </span>
            </Link>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex 2xl:gap-6">
            {nav.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.label}
                  href={n.href}
                  className={cn(
                    "relative inline-flex shrink-0 items-center gap-1 whitespace-nowrap py-1 text-[12px] font-semibold transition-colors 2xl:text-[13px]",
                    active ? "text-maroon" : "text-foreground/75 hover:text-primary",
                  )}
                >
                  {n.label}
                  {n.label === "Courses" && <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                  {active && (
                    <span className="absolute -bottom-[18px] left-0 right-0 h-0.5 rounded-full bg-maroon md:-bottom-[22px]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-2.5">
            <button
              type="button"
              className="hidden h-9 w-9 place-items-center rounded-lg text-foreground/60 hover:bg-muted hover:text-primary md:grid"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/cart"
              className="relative grid h-9 w-9 place-items-center rounded-lg text-foreground/60 hover:bg-muted hover:text-primary"
              aria-label="Cart"
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
                  className="hidden rounded-md border border-maroon/30 px-3 py-2 text-[13px] font-semibold text-maroon hover:bg-maroon/5 sm:px-4 md:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href={`/signup?next=${encodeURIComponent(pathname)}`}
                  className="hidden rounded-md bg-maroon px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95 sm:px-4 md:inline-flex"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </Container>
      </header>

      {/* Mobile side drawer */}
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={closeDrawer}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(320px,85vw)] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={closeDrawer}>
            <img
              src={images.logo}
              alt="Madinano"
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-extrabold text-ink">Madinano</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                Global Pvt. Ltd.
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-muted"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search courses..."
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {nav.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <li key={n.label}>
                  <Link
                    href={n.href}
                    onClick={closeDrawer}
                    className={cn(
                      "flex items-center justify-between whitespace-nowrap rounded-xl px-3 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-maroon/10 text-maroon"
                        : "text-foreground/80 hover:bg-muted hover:text-ink",
                    )}
                  >
                    {n.label}
                    {n.label === "Courses" && <ChevronDown className="h-4 w-4 opacity-50" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-border p-4">
          <Link
            href="/cart"
            onClick={closeDrawer}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted"
          >
            <ShoppingBag className="h-4 w-4" />
            Cart {cartCount > 0 ? `(${cartCount})` : ""}
          </Link>

          {student ? (
            <div className="grid gap-2">
              <Link
                href="/dashboard"
                onClick={closeDrawer}
                className="flex items-center justify-center gap-2 rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-white"
              >
                <User className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  logoutStudent().then(() => setStudent(null));
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-maroon/30 px-4 py-3 text-sm font-semibold text-maroon hover:bg-maroon/5"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                onClick={closeDrawer}
                className="rounded-xl border border-maroon/30 px-4 py-3 text-center text-sm font-semibold text-maroon hover:bg-maroon/5"
              >
                Login
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(pathname)}`}
                onClick={closeDrawer}
                className="rounded-xl bg-maroon px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            </div>
          )}

          <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-[12px] text-muted-foreground">
            <a className="flex items-center gap-2 hover:text-primary" href="tel:+911234567890">
              <Phone className="h-3.5 w-3.5 shrink-0" /> +91 12345 67890
            </a>
            <a
              className="flex items-center gap-2 hover:text-primary"
              href="mailto:support@madinano.com"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" /> support@madinano.com
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
