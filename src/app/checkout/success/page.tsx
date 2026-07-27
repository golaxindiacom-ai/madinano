import { Suspense } from "react";
import { CheckoutSuccessPage } from "@/components/checkout/checkout-success-page";

export default function CheckoutSuccessRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CheckoutSuccessPage />
    </Suspense>
  );
}
