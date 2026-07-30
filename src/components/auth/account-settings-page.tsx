"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { syncSessionFromServer, type StudentSession } from "@/lib/exam/student-session";

export function AccountSettingsPage({
  backHref,
  backLabel,
  nextPath,
  embedded = false,
}: {
  backHref: string;
  backLabel: string;
  nextPath: string;
  embedded?: boolean;
}) {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncSessionFromServer().then((user) => {
      if (!user) {
        window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
        return;
      }
      setSession(user);
      setLoading(false);
    });
  }, [nextPath]);

  const content = (
    <>
      {!embedded ? (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      ) : null}
      <h1 className="text-xl font-extrabold text-ink sm:text-2xl">Account Security</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your login password for this account.</p>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading account...</p>
      ) : session ? (
        <div className="mt-6 space-y-4 sm:mt-8">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signed in as</p>
            <p className="mt-1 font-semibold text-ink">{session.name}</p>
            <p className="text-sm text-muted-foreground">{session.email}</p>
          </div>
          <ChangePasswordForm />
        </div>
      ) : null}
    </>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <Container className="max-w-xl py-10">{content}</Container>
      <SiteFooter />
    </div>
  );
}
