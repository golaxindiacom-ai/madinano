"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  IndianRupee,
  Loader2,
  ShieldCheck,
  Tag,
  Trash2,
} from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import {
  clearCart,
  fetchCartData,
  getCartCourseIds,
  onCartChange,
  removeFromCart,
  type CartPayload,
} from "@/lib/cart/cart-store";
import { getStudentSession, syncSessionFromServer } from "@/lib/exam/student-session";
import type { BillingAddress, PublicCoupon } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

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

export function CartPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [student, setStudent] = useState(getStudentSession());
  const [data, setData] = useState<CartPayload | null>(null);
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

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchCartData();
      setData(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncSessionFromServer().then((session) => {
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent("/cart")}`);
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
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    loadCart();
    return onCartChange(loadCart);
  }, [authReady, loadCart]);

  const subtotal = useMemo(
    () => (data?.items ?? []).reduce((sum, item) => sum + item.sellingPrice, 0),
    [data?.items],
  );
  const finalPrice = couponApplied?.finalPrice ?? subtotal;
  const discount = couponApplied?.discount ?? 0;
  const courseIds = useMemo(() => (data?.items ?? []).map((item) => item.id), [data?.items]);

  const applyCouponCode = async (code: string) => {
    if (!code.trim() || !courseIds.length) return;
    setCouponLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate-coupon", code: code.trim(), courseIds }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error);
      setCoupon(code.trim().toUpperCase());
      setCouponApplied({
        code: json.data.code,
        discount: json.data.discount,
        finalPrice: json.data.finalPrice,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Invalid coupon");
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const pay = async () => {
    if (!student || !courseIds.length) return;
    setProcessing(true);
    setError("");
    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseIds,
          userId: student.id,
          method,
          couponCode: couponApplied?.code,
          billingAddress: billing,
        }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error);
      clearCart();
      const firstOrder = json.data.results?.[0]?.order?.orderNo;
      router.push(`/checkout/success?order=${firstOrder || "cart"}&course=${courseIds[0]}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

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
        kicker="Cart"
        title={
          <>
            Your <span className="text-primary">Cart</span>
          </>
        }
        subtitle="Realtime course pricing from the platform database"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: "Cart" },
        ]}
        align="left"
      >
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>
      </PageHero>
      <PageBand tone="courses">
        <Container>
        {loading ? (
          <p className="text-muted-foreground">Loading cart...</p>
        ) : !data?.items.length ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center shadow-card">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link href="/courses" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h2 className="mb-4 font-bold text-ink">Cart Items ({data.items.length})</h2>
                <div className="space-y-4">
                  {data.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div className="flex flex-1 gap-4">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />
                        ) : (
                          <div className="h-16 w-24 rounded-lg bg-muted" />
                        )}
                        <div>
                          <h3 className="font-semibold text-ink">{item.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.instructorName} · {item.duration}
                          </p>
                          <p className="mt-1 font-bold text-primary">₹{item.sellingPrice.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <BillingForm billing={billing} setBilling={setBilling} />

              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-3 font-semibold text-ink">Payment Method</h3>
                <div className="space-y-2">
                  {METHODS.map((paymentMethod) => (
                    <button
                      key={paymentMethod.value}
                      type="button"
                      onClick={() => setMethod(paymentMethod.value)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
                        method === paymentMethod.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-ink">{paymentMethod.label}</p>
                        <p className="text-xs text-muted-foreground">{paymentMethod.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <CouponSection
                coupon={coupon}
                setCoupon={setCoupon}
                couponApplied={couponApplied}
                availableCoupons={data.availableCoupons}
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
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{finalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button
                type="button"
                onClick={pay}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                {processing ? "Processing..." : `Pay ₹${finalPrice.toLocaleString("en-IN")}`}
              </button>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Live gateways apply on single-course checkout.
              </p>

              <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
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
