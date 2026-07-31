"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { saveStudentSession } from "@/lib/exam/student-session";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Signup failed");
      }
      saveStudentSession(json.data);
      window.dispatchEvent(new Event("nbg-auth-change"));
      router.push(next);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Signup failed");
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
            Create your <span className="text-primary">account</span>
          </>
        }
        subtitle="Join Madinano and start learning today."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sign up" }]}
      />
      <PageBand tone="trusted">
        <Container className="flex justify-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-ink">Get started</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fill in your details below</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Full name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="Your name"
                />
              </div>
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
                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Phone (optional)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="At least 6 characters"
                />
              </div>

              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}
