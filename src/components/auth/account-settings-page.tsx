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
}: {
  backHref: string;
  backLabel: string;
  nextPath: string;
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

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <Container className="max-w-xl py-10">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <h1 className="text-2xl font-extrabold text-ink">Account Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your login password for this account.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading account...</p>
        ) : session ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Signed in as
              </p>
              <p className="mt-1 font-semibold text-ink">{session.name}</p>
              <p className="text-sm text-muted-foreground">{session.email}</p>
            </div>
            <ChangePasswordForm />
          </div>
        ) : null}
      </Container>
      <SiteFooter />
    </div>
  );
}
