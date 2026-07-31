"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  Search,
  ChevronDown,
  ExternalLink,
  ChevronRight,
  X,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin/resources";
import { cn } from "@/lib/utils";
import { images } from "@/lib/images";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { logoutStudent } from "@/lib/exam/student-session";
import type { AuthUser } from "@/lib/auth/auth-service";

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

function AdminNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        href="/admin"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition",
          pathname === "/admin"
            ? "bg-primary text-primary-foreground"
            : "text-foreground/75 hover:bg-muted hover:text-ink",
        )}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        Dashboard
      </Link>

      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.section} className="mt-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            {section.section}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/75 hover:bg-muted hover:text-ink",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {"key" in item && item.key ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function AdminSidebarFooter({
  onNavigate,
  onLogout,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-2 border-t border-border p-4">
      <Link
        href="/admin/settings"
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-foreground/80 hover:border-primary hover:text-primary"
      >
        <Settings className="h-3.5 w-3.5" /> Account Settings
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

export function AdminShell({ children }: { children: React.ReactNode }) {
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

  const handleLogout = async () => {
    setUserMenuOpen(false);
    closeDrawer();
    await logoutStudent();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Mobile drawer backdrop */}
      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={closeDrawer}
          aria-label="Close menu"
        />
      ) : null}

      {/* Mobile slide-in drawer (< lg) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[90] flex w-[min(300px,92vw)] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={images.logo} alt="Madinano" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-extrabold text-ink">Madinano</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                LMS Admin Panel
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <AdminNavLinks pathname={pathname} onNavigate={closeDrawer} />
        </nav>

        <AdminSidebarFooter onNavigate={closeDrawer} onLogout={handleLogout} />
      </aside>

      {/* Desktop sidebar (lg+) */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img src={images.logo} alt="Madinano" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-extrabold text-ink">Madinano</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              LMS Admin Panel
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <AdminNavLinks pathname={pathname} />
        </nav>

        <AdminSidebarFooter onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 w-full flex-1 flex-col">
        <header className="sticky top-0 z-[70] border-b border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            {/* Menu toggle — always visible below lg */}
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm hover:bg-muted lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 lg:hidden">
              <p className="truncate text-sm font-bold text-ink">Admin Panel</p>
              <p className="truncate text-[11px] text-muted-foreground">Madinano</p>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 md:flex md:max-w-md">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search admin..."
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="relative ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <NotificationBell className="shrink-0" />
              <NotificationBell mode="emails" className="hidden shrink-0 sm:block" />

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
                  <img src={images.inst1} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-9 sm:w-9" />
                  <div className="hidden min-w-0 text-left leading-tight md:block">
                    <p className="truncate text-sm font-bold text-ink">{user?.name ?? "Admin User"}</p>
                    <p className="truncate text-[11px] capitalize text-muted-foreground">{user?.role ?? "admin"}</p>
                  </div>
                  <ChevronDown className={cn("hidden h-4 w-4 shrink-0 text-muted-foreground transition md:block", userMenuOpen && "rotate-180")} />
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
                        <p className="truncate text-sm font-bold text-ink">{user?.name ?? "Admin User"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <Link
                        href="/admin/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted"
                      >
                        <Settings className="h-4 w-4" /> Account Settings
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

          <div className="border-t border-border px-3 pb-3 md:hidden">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search admin..."
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
