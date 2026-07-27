"use client";

import type { CheckoutCourseInfo, PublicCoupon } from "@/lib/admin/types";
import { getStudentSession } from "@/lib/exam/student-session";

const CART_KEY = "nbg-cart";
const CART_EVENT = "nbg-cart-change";

function cartStorageKey() {
  const session = getStudentSession();
  return session?.id ? `${CART_KEY}-${session.id}` : `${CART_KEY}-guest`;
}

export function getCartCourseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cartStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function setCartCourseIds(courseIds: string[]) {
  if (typeof window === "undefined") return;
  const unique = [...new Set(courseIds.filter(Boolean))];
  localStorage.setItem(cartStorageKey(), JSON.stringify(unique));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(courseId: string) {
  const ids = getCartCourseIds();
  if (!ids.includes(courseId)) {
    setCartCourseIds([courseId, ...ids]);
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

export function removeFromCart(courseId: string) {
  setCartCourseIds(getCartCourseIds().filter((id) => id !== courseId));
}

export function clearCart() {
  setCartCourseIds([]);
}

export function getCartCount() {
  return getCartCourseIds().length;
}

export function onCartChange(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CART_EVENT, listener);
  window.addEventListener("nbg-auth-change", listener);
  return () => {
    window.removeEventListener(CART_EVENT, listener);
    window.removeEventListener("nbg-auth-change", listener);
  };
}

export type CartPayload = {
  items: CheckoutCourseInfo[];
  availableCoupons: PublicCoupon[];
};

export async function fetchCartData(): Promise<CartPayload> {
  const ids = getCartCourseIds();
  if (!ids.length) {
    const empty = await fetch("/api/cart", { cache: "no-store" }).then((r) => r.json());
    return empty.success ? empty.data : { items: [], availableCoupons: [] };
  }

  const response = await fetch(`/api/cart?ids=${encodeURIComponent(ids.join(","))}`, {
    cache: "no-store",
  });
  const json = await response.json();
  if (!json.success) throw new Error(json.error || "Failed to load cart");
  return json.data as CartPayload;
}
