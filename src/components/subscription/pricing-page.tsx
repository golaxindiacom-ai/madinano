"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { PageBand, PageHero } from "@/components/page-hero";
import { getStudentSession, syncSessionFromServer } from "@/lib/exam/student-session";
import type { Payment, SubscriptionPlanInfo } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const METHODS: { value: Payment["method"]; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "paypal", label: "PayPal" },
  { value: "bank", label: "Net Banking" },
];

export function PricingPage() {
  const router = useRouter();
  const [student, setStudent] = useState(getStudentSession());
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [method, setMethod] = useState<Payment["method"]>("upi");
  const [autoRenew, setAutoRenew] = useState(true);
  const [error, setError] = useState("");
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    const load = async () => {
      const session = await syncSessionFromServer();
      setStudent(session);

      try {
        const plansRes = await fetch("/api/subscriptions/plans").then((r) => r.json());
        setPlans(plansRes.data ?? []);

        if (session) {
          const activeRes = await fetch("/api/subscriptions/mine?active=true", {
            credentials: "include",
          }).then((r) => r.json());
          setHasActive(Boolean(activeRes.data));
        } else {
          setHasActive(false);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const subscribe = async (planId: SubscriptionPlanInfo["id"]) => {
    if (!student) {
      router.push("/login?next=/pricing");
      return;
    }
    setSubscribing(planId);
    setError("");
    try {
      const res = await fetch("/api/subscriptions/mine", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, method, autoRenew }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      router.push("/dashboard/subscription?success=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscription failed");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Premium Plans"
        title={
          <>
            Unlock Your Full <span className="text-primary">Learning Potential</span>
          </>
        }
        subtitle="Get unlimited access to all courses, live classes, certificates & premium support."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
          <Crown className="h-3.5 w-3.5" /> Membership
        </div>
      </PageHero>

      <PageBand tone="categories">
      <Container>
        {hasActive && (
          <div className="mx-auto max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
            You already have an active subscription.{" "}
            <Link href="/dashboard/subscription" className="font-semibold underline">Manage subscription →</Link>
          </div>
        )}

        <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-3 text-sm">
          <span className="text-muted-foreground">Pay with:</span>
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={cn(
                "rounded-full border px-3 py-1 font-semibold",
                method === m.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
          Enable auto-renewal
        </label>

        {error && (
          <div className="mx-auto mt-6 max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="mt-12 text-center text-muted-foreground">Loading plans...</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-6 shadow-card",
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border",
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </span>
                )}
                <h2 className="text-lg font-bold text-ink">{plan.label}</h2>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-ink">₹{plan.amount.toLocaleString("en-IN")}</span>
                  <span className="ml-1 text-sm text-muted-foreground">/{plan.period}</span>
                </div>
                {plan.savings && <p className="mt-1 text-xs font-semibold text-primary">{plan.savings}</p>}
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={Boolean(subscribing) || hasActive}
                  onClick={() => subscribe(plan.id)}
                  className={cn(
                    "mt-6 w-full rounded-full py-3 text-sm font-bold disabled:opacity-60",
                    plan.popular ? "bg-primary text-primary-foreground" : "border border-border bg-background",
                  )}
                >
                  {subscribing === plan.id ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
                  ) : hasActive ? (
                    "Already Subscribed"
                  ) : (
                    `Get ${plan.label}`
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}
