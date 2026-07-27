"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Search,
  ChevronDown,
  ExternalLink,
  ChevronRight,
  X,
} from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin/resources";
import { cn } from "@/lib/utils";
import { images } from "@/lib/images";
import { LayoutDashboard } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <img src={images.logo} alt="Navbharat Gurukulam" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-ink">Navbharat Gurukulam</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                LMS Admin Panel
              </p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition",
              pathname === "/admin"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/75 hover:bg-muted hover:text-ink",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
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
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-semibold transition",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/75 hover:bg-muted hover:text-ink",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        {"key" in item && item.key ? (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-foreground/80 hover:border-primary hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View Website
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-foreground/70 hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 sm:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search admin..."
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell className="hidden sm:block" />
            <NotificationBell mode="emails" className="hidden sm:block" />
            <Link href="/admin/settings" className="flex items-center gap-2 rounded-lg pl-1 hover:bg-muted/50">
              <img src={images.inst1} alt="Admin" className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9" />
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-bold text-ink">Admin User</p>
                <p className="text-[11px] text-muted-foreground">Account & password</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Link>
          </div>
        </div>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
