"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LogOut,
  Home,
  Video,
  ClipboardList,
  User,
  Receipt,
  ShoppingCart,
  Crown,
  BookOpen,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { images } from "@/lib/images";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { logoutStudent } from "@/lib/exam/student-session";
import type { AuthUser } from "@/lib/auth/auth-service";

type NavItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href: string;
};

const STUDENT_NAV = {
  primary: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Video, label: "Live Classes", href: "/live-classes" },
    { icon: ClipboardList, label: "Exams", href: "/exams" },
    { icon: User, label: "Account", href: "/dashboard/account" },
  ],
  billing: [
    { icon: Receipt, label: "Payment History", href: "/dashboard/payments" },
    { icon: ShoppingCart, label: "My Orders", href: "/dashboard/orders" },
    { icon: Crown, label: "My Subscription", href: "/dashboard/subscription" },
    { icon: BookOpen, label: "Pricing", href: "/pricing" },
  ],
} satisfies Record<string, NavItem[]>;

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/account": "Account",
  "/dashboard/payments": "Payment History",
  "/dashboard/orders": "My Orders",
  "/dashboard/subscription": "My Subscription",
};

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

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StudentNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <NavGroup title="Student" items={STUDENT_NAV.primary} pathname={pathname} onNavigate={onNavigate} />
      <NavGroup title="Billing" items={STUDENT_NAV.billing} pathname={pathname} onNavigate={onNavigate} />
    </>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PremiumUpsell({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="mx-3 mb-3 rounded-2xl border border-maroon/20 bg-gradient-to-br from-maroon/15 to-gold/10 p-4 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-maroon/10">
        <Trophy className="h-6 w-6 text-gold" />
      </div>
      <div className="text-sm font-bold text-ink">Upgrade to Premium</div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Unlock unlimited courses, certificates and live classes.
      </p>
      <Link
        href="/pricing"
        onClick={onNavigate}
        className="mt-3 block w-full rounded-lg bg-maroon py-2 text-center text-xs font-semibold text-white hover:opacity-90"
      >
        Go Premium
      </Link>
    </div>
  );
}

function StudentSidebarFooter({
  user,
  onNavigate,
  onLogout,
}: {
  user: AuthUser | null;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-2 border-t border-border p-3">
      <Link
        href="/dashboard/account"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/40"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-maroon to-gold text-sm font-bold text-white">
          {user ? initials(user.name) : "NG"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{user?.name ?? "Student"}</div>
          <div className="truncate text-[11px] text-muted-foreground">Account & password</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onLogout();
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-maroon/30 bg-maroon/5 py-2.5 text-xs font-semibold text-maroon hover:bg-maroon/10"
      >
        <LogOut className="h-3.5 w-3.5" /> Logout
      </button>
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-foreground/80 hover:border-primary hover:text-primary"
      >
        <ExternalLink className="h-3.5 w-3.5" /> View Website
      </Link>
    </div>
  );
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useBodyScrollLock(drawerOpen);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json.data) setUser(json.data as AuthUser);
      })
      .catch(() => {});
  }, []);

  const closeDrawer = () => setDrawerOpen(false);
  const pageTitle = PAGE_TITLES[pathname] ?? "Student Dashboard";

  const handleLogout = async () => {
    setUserMenuOpen(false);
    closeDrawer();
    await logoutStudent();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={closeDrawer}
          aria-label="Close menu"
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[90] flex w-[min(300px,92vw)] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <Link href="/" onClick={closeDrawer} className="flex min-w-0 items-center gap-2.5">
            <img src={images.logo} alt="Madinano" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-extrabold text-ink">
                Madinano <span className="text-primary">Global</span>
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">Learn | Grow | Succeed</p>
            </div>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <StudentNavLinks pathname={pathname} onNavigate={closeDrawer} />
        </nav>

        <PremiumUpsell onNavigate={closeDrawer} />
        <StudentSidebarFooter user={user} onNavigate={closeDrawer} onLogout={handleLogout} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur lg:flex">
        <Link href="/" className="flex items-center gap-2.5 border-b border-border px-6 py-5">
          <img src={images.logo} alt="Madinano" className="h-11 w-11 shrink-0 rounded-full object-cover" />
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-ink">
              Madinano <span className="text-primary">Global</span>
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground">Learn | Grow | Succeed</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
          <StudentNavLinks pathname={pathname} />
        </nav>

        <PremiumUpsell />
        <StudentSidebarFooter user={user} onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 w-full flex-1 flex-col">
        <header className="sticky top-0 z-[70] border-b border-border bg-card/40 backdrop-blur">
          <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm hover:bg-muted lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink sm:text-base">{pageTitle}</p>
              <p className="truncate text-[11px] text-muted-foreground lg:hidden">Madinano</p>
            </div>

            <div className="relative ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <NotificationBell buttonClassName="h-9 w-9 rounded-xl border border-border bg-background/50 sm:h-10 sm:w-10" />

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-maroon/30 px-2.5 text-xs font-semibold text-maroon hover:bg-maroon/5 sm:px-3"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-lg py-1 pl-1 hover:bg-muted/50 sm:gap-2"
                  aria-expanded={userMenuOpen}
                  aria-label="Account menu"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-maroon to-gold text-xs font-bold text-white sm:h-9 sm:w-9">
                    {user ? initials(user.name) : "NG"}
                  </div>
                  <div className="hidden min-w-0 text-left leading-tight md:block">
                    <p className="truncate text-sm font-bold text-ink">{user?.name ?? "Student"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user?.email ?? ""}</p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "hidden h-4 w-4 shrink-0 text-muted-foreground transition md:block",
                      userMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {userMenuOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-[60]"
                      onClick={() => setUserMenuOpen(false)}
                      aria-label="Close account menu"
                    />
                    <div className="absolute right-0 top-full z-[70] mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                      <div className="border-b border-border px-4 py-3 md:hidden">
                        <p className="truncate text-sm font-bold text-ink">{user?.name ?? "Student"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted"
                      >
                        <User className="h-4 w-4" /> Account Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-maroon hover:bg-maroon/5"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
