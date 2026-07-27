"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, BookOpen, Receipt, ShoppingCart } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageBand, PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";

export function CheckoutSuccessPage() {
  const params = useSearchParams();
  const orderNo = params.get("order");
  const courseId = params.get("course");

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Checkout"
        title={
          <>
            Payment <span className="text-primary">Successful</span>
          </>
        }
        subtitle="Your course purchase is complete. You have been enrolled and can start learning right away."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Success" },
        ]}
      />
      <PageBand tone="process">
        <Container className="max-w-xl text-center">
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            {orderNo ? (
              <p className="mt-6 font-mono text-sm text-muted-foreground">Order: {orderNo}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {courseId ? (
                <Link
                  href={`/courses/${courseId}/learn`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <BookOpen className="h-4 w-4" /> Start Learning
                </Link>
              ) : null}
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold"
              >
                <ShoppingCart className="h-4 w-4" /> My Orders
              </Link>
              <Link
                href="/dashboard/payments"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold"
              >
                <Receipt className="h-4 w-4" /> Payment History
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold"
              >
                Browse More Courses
              </Link>
            </div>
          </div>
        </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}
