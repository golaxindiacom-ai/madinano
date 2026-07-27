import { Suspense } from "react";
import { MySubscriptionPage } from "@/components/subscription/my-subscription-page";

export default function DashboardSubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MySubscriptionPage />
    </Suspense>
  );
}
