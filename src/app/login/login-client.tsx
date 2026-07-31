"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { saveStudentSession } from "@/lib/exam/student-session";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json.data) router.replace(next);
      })
      .catch(() => {});
  }, [next, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Login failed");
      }
      saveStudentSession(json.data);
      window.dispatchEvent(new Event("nbg-auth-change"));
      if (json.data.role === "admin" || json.data.role === "instructor") {
        router.push(next.startsWith("/admin") || next.startsWith("/instructor") ? next : "/admin");
      } else {
        router.push(next);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Account"
        title={
          <>
            Welcome <span className="text-primary">back</span>
          </>
        }
        subtitle="Sign in to purchase courses and track your learning."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Login" }]}
      />
      <PageBand tone="trusted">
        <Container className="flex justify-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <LogIn className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-ink">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Use your email and password</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>

              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
                Create account
              </Link>
            </p>

            <p className="mt-4 rounded-xl bg-muted/50 px-3 py-2 text-center text-[11px] text-muted-foreground">
              Student: arjun.mehta@email.com / password123
              <br />
              Admin: admin@madinano.com / password123
            </p>
          </div>
        </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}
