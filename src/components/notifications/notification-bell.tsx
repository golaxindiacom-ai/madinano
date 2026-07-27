"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  message: string;
  type: string;
  color: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

type EmailItem = {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({
  mode = "notifications",
  className,
  buttonClassName,
}: {
  mode?: "notifications" | "emails";
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = mode === "emails" ? "/api/notifications?emails=true" : "/api/notifications";
      const response = await fetch(url, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "Unable to load");
      }
      if (mode === "emails") {
        setEmails(json.data?.emails ?? []);
      } else {
        setItems(json.data?.items ?? []);
        setUnread(json.data?.unreadCount ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 45000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void load();
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, load]);

  const markAllRead = async () => {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const json = await response.json();
    if (response.ok && json.success) {
      setItems(json.data?.items ?? []);
      setUnread(json.data?.unreadCount ?? 0);
    }
  };

  const Icon = mode === "emails" ? Mail : Bell;
  const badge = mode === "emails" ? emails.filter((e) => e.status === "queued").length : unread;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-lg text-foreground/70 hover:bg-muted",
          buttonClassName,
        )}
        aria-label={mode === "emails" ? "Email alerts" : "Notifications"}
      >
        <Icon className="h-4 w-4" />
        {badge > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-maroon px-1 text-[9px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-border bg-card shadow-float">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-bold text-ink">
                {mode === "emails" ? "Email alerts" : "Notifications"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {mode === "emails" ? "Outbound messages & receipts" : "Live activity from the platform"}
              </p>
            </div>
            {mode === "notifications" ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-sm text-red-600">{error}</p>
            ) : mode === "emails" ? (
              emails.length ? (
                emails.map((email) => (
                  <div key={email.id} className="border-b border-border px-4 py-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{email.subject}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          email.status === "sent"
                            ? "bg-emerald-100 text-emerald-700"
                            : email.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {email.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">To: {email.to}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-foreground/80">{email.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(email.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No email alerts yet.</p>
              )
            ) : items.length ? (
              items.map((item) => {
                const content = (
                  <>
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.color)} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", item.read ? "text-muted-foreground" : "font-semibold text-ink")}>
                          {item.message}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {item.type} · {timeAgo(item.createdAt)}
                        </p>
                      </div>
                      {!item.read ? <span className="mt-1 h-2 w-2 rounded-full bg-primary" /> : null}
                    </div>
                  </>
                );
                return item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border px-4 py-3 last:border-0 hover:bg-muted/40"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={item.id} className="border-b border-border px-4 py-3 last:border-0">
                    {content}
                  </div>
                );
              })
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
