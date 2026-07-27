"use client";

import Link from "next/link";
import { Clock, GraduationCap, Heart, Star } from "lucide-react";
import { BuyOrCartActions } from "@/components/cart/add-to-cart-button";
import type { PublicCourseCard as PublicCourseCardType } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Props = {
  course: PublicCourseCardType;
  className?: string;
};

export function PublicCourseCard({ course, className }: Props) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-float",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Link href={`/courses/${course.id}`} className="block h-full">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-maroon/20 to-primary/20">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
          )}
        </Link>
        <button
          type="button"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-card/95 text-muted-foreground shadow-sm hover:text-maroon"
          aria-label="Save course"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="inline-flex w-fit rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
          {course.categoryName}
        </span>
        <Link
          href={`/courses/${course.id}`}
          className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-primary"
        >
          {course.title}
        </Link>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {course.rating.toFixed(1)}{" "}
            <span className="text-muted-foreground">({course.enrollments})</span>
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {course.duration}
          </span>
        </div>
        <div className="mt-auto space-y-3 border-t border-border pt-3">
          <div>
            <span className="text-base font-extrabold text-gold">
              ₹{course.sellingPrice.toLocaleString("en-IN")}
            </span>
            {course.originalPrice > course.sellingPrice ? (
              <span className="ml-1.5 text-xs text-muted-foreground line-through">
                ₹{course.originalPrice.toLocaleString("en-IN")}
              </span>
            ) : null}
          </div>
          <BuyOrCartActions courseId={course.id} sellingPrice={course.sellingPrice} cartLabel="Cart" />
        </div>
      </div>
    </article>
  );
}
