"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/cart/cart-store";
import { getStudentSession } from "@/lib/exam/student-session";
import { cn } from "@/lib/utils";

type Props = {
  courseId: string;
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
};

export function AddToCartButton({
  courseId,
  label = "Add to Cart",
  className,
  variant = "primary",
}: Props) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    const session = getStudentSession();
    if (!session) {
      router.push(`/login?next=${encodeURIComponent("/cart")}`);
      return;
    }
    addToCart(courseId);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-bold transition",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border border-primary text-primary hover:bg-primary/10",
        className,
      )}
    >
      {added ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>{added ? "Added" : label}</span>
    </button>
  );
}

export function BuyOrCartActions({
  courseId,
  sellingPrice,
  className,
  cartLabel = "Cart",
}: {
  courseId: string;
  sellingPrice: number;
  className?: string;
  cartLabel?: string;
}) {
  return (
    <div className={cn("grid w-full grid-cols-2 gap-2", className)}>
      <AddToCartButton
        courseId={courseId}
        variant="outline"
        label={cartLabel}
        className="w-full"
      />
      <Link
        href={`/checkout/${courseId}`}
        className="inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:opacity-90"
      >
        {sellingPrice === 0 ? "Enroll" : "Buy Now"}
      </Link>
    </div>
  );
}


