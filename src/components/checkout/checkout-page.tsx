"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Loader2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { getStudentSession, syncSessionFromServer } from "@/lib/exam/student-session";
import type { BillingAddress, CheckoutPageData, CheckoutResult, PublicCoupon } from "@/lib/admin/types";
import { openGatewayCheckout } from "@/lib/payments/checkout-client";
import { cn } from "@/lib/utils";

type PaymentConfig = {
  provider: "razorpay" | "cashfree" | "demo";
};

const METHODS = [
  { value: "upi", label: "UPI", desc: "Google Pay, PhonePe, Paytm" },
  { value: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay" },
  { value: "paypal", label: "PayPal", desc: "International payments" },
  { value: "bank", label: "Net Banking", desc: "All major banks" },
] as const;

const EMPTY_BILLING: BillingAddress = {
  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

export function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.courseId);

  const [authReady, setAuthReady] = useState(false);
  const [student, setStudent] = useState(getStudentSession());
  const [course, setCourse] = useState<CheckoutPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("upi");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState<{
    discount: number;
    finalPrice: number;
    code: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [billing, setBilling] = useState<BillingAddress>(EMPTY_BILLING);
  const [payConfig, setPayConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    fetch("/api/payments/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.provider) {
          setPayConfig({ provider: j.data.provider });
        }
      })
      .catch(() => setPayConfig({ provider: "demo" }));
  }, []);

  useEffect(() => {
    syncSessionFromServer().then((session) => {
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(`/checkout/${courseId}`)}`);
        return;
      }
      setStudent(session);
      setBilling((prev) => ({
        ...prev,
        fullName: session.name,
        email: session.email,
      }));
      setAuthReady(true);
    });
  }, [courseId, router]);

  useEffect(() => {
    if (!authReady) return;
    fetch(`/api/checkout/${courseId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.error);
        setCourse(j.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load course"))
      .finally(() => setLoading(false));
  }, [authReady, courseId]);

  const applyCouponCode = async (code: string) => {
    if (!code.trim()) return;
    setCouponLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/checkout/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate-coupon", code: code.trim() }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setCoupon(code.trim().toUpperCase());
      setCouponApplied({ code: j.data.code, discount: j.data.discount, finalPrice: j.data.finalPrice });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid coupon");
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const pay = async () => {
    if (!student) return;
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`/api/checkout/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: student.id,
          method,
          couponCode: couponApplied?.code,
          billingAddress: billing,
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      const result = j.data as CheckoutResult;
      const provider = result.gateway?.provider;
      if (provider === "razorpay" || provider === "cashfree") {
        const paid = await openGatewayCheckout(result.gateway);
        if (!paid) {
          setError("Payment cancelled. You can try again when ready.");
          return;
        }
      }
      router.push(`/checkout/success?order=${result.order.orderNo}&course=${courseId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const gatewayBadge =
    payConfig?.provider === "razorpay"
      ? "Razorpay"
      : payConfig?.provider === "cashfree"
        ? "Cashfree"
        : "Demo pay";

  const finalPrice = couponApplied?.finalPrice ?? course?.sellingPrice ?? 0;
  const discount = couponApplied?.discount ?? 0;

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background">
        <SiteTopBar />
        <SiteHeader />
        <Container className="py-20 text-center text-muted-foreground">Checking login...</Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Checkout"
        title={
          <>
            Secure <span className="text-primary">Checkout</span>
          </>
        }
        subtitle="Login required — complete your purchase securely"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: "Checkout" },
        ]}
        align="left"
      >
        <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Link>
      </PageHero>
      <PageBand tone="categories">
        <Container>
        {loading ? (
          <p className="text-muted-foreground">Loading checkout...</p>
        ) : !course ? (
          <p className="text-red-600">{error || "Course not available"}</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h2 className="font-bold text-ink">{course.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  By {course.instructorName} · {course.duration} · {course.level}
                </p>
              </div>

              <BillingForm billing={billing} setBilling={setBilling} />

              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-3 font-semibold text-ink">Payment Method</h3>
                <div className="space-y-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
                        method === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                      )}
                    >
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-ink">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <CouponSection
                coupon={coupon}
                setCoupon={setCoupon}
                couponApplied={couponApplied}
                availableCoupons={course.availableCoupons}
                couponLoading={couponLoading}
                onApply={() => applyCouponCode(coupon)}
                onSelect={applyCouponCode}
              />
            </div>

            <div className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-bold text-ink">Order Summary</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{student?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Price</span>
                  <span className={discount ? "line-through text-muted-foreground" : "font-semibold"}>
                    ₹{course.originalPrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course Price</span>
                  <span>₹{course.sellingPrice}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{finalPrice}</span>
                </div>
              </div>

              {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="mt-6 flex items-center justify-between gap-2">
                <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {gatewayBadge}
                </span>
              </div>

              <button
                type="button"
                onClick={pay}
                disabled={processing}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                {processing ? "Processing..." : `Pay ₹${finalPrice}`}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout — instant enrollment on success
              </p>
            </div>
          </div>
        )}
        </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}

function BillingForm({
  billing,
  setBilling,
}: {
  billing: BillingAddress;
  setBilling: React.Dispatch<React.SetStateAction<BillingAddress>>;
}) {
  const update = (field: keyof BillingAddress, value: string) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-4 font-semibold text-ink">Billing Address</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" value={billing.fullName} onChange={(v) => update("fullName", v)} className="sm:col-span-2" />
        <Field label="Email" value={billing.email} onChange={(v) => update("email", v)} type="email" />
        <Field label="Phone" value={billing.phone} onChange={(v) => update("phone", v)} />
        <Field label="Address line 1" value={billing.addressLine1} onChange={(v) => update("addressLine1", v)} className="sm:col-span-2" />
        <Field label="Address line 2" value={billing.addressLine2 || ""} onChange={(v) => update("addressLine2", v)} className="sm:col-span-2" />
        <Field label="City" value={billing.city} onChange={(v) => update("city", v)} />
        <Field label="State" value={billing.state} onChange={(v) => update("state", v)} />
        <Field label="Pincode" value={billing.pincode} onChange={(v) => update("pincode", v)} />
        <Field label="Country" value={billing.country} onChange={(v) => update("country", v)} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-semibold text-foreground/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function CouponSection({
  coupon,
  setCoupon,
  couponApplied,
  availableCoupons,
  couponLoading,
  onApply,
  onSelect,
}: {
  coupon: string;
  setCoupon: (value: string) => void;
  couponApplied: { code: string; discount: number } | null;
  availableCoupons: PublicCoupon[];
  couponLoading: boolean;
  onApply: () => void;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-3 font-semibold text-ink">Coupon Code</h3>
      <div className="flex gap-2">
        <input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          placeholder="e.g. NEWYEAR50"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={couponLoading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {couponLoading ? "..." : "Apply"}
        </button>
      </div>
      {couponApplied ? (
        <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
          <Tag className="h-3.5 w-3.5" /> {couponApplied.code} applied — saved ₹{couponApplied.discount}
        </p>
      ) : null}
      {availableCoupons.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Available offers from admin
          </p>
          <div className="flex flex-wrap gap-2">
            {availableCoupons.map((offer) => (
              <button
                key={offer.code}
                type="button"
                onClick={() => onSelect(offer.code)}
                className="rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-left text-xs hover:border-primary"
              >
                <span className="font-bold text-primary">{offer.code}</span>
                <span className="ml-2 text-muted-foreground">{offer.description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
