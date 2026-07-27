"use client";

import Link from "next/link";
import { BookOpen, Star, Users } from "lucide-react";
import type { PublicInstructorCard as PublicInstructorCardType } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Props = {
  instructor: PublicInstructorCardType;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatCount(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(".0", "")}K` : `${value}`;
}

export function PublicInstructorCard({ instructor, className }: Props) {
  return (
    <Link
      href={`/instructors/${instructor.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-float",
        className,
      )}
    >
      <div className="relative flex flex-col items-center bg-gradient-to-b from-primary/10 via-muted/40 to-card px-5 pb-2 pt-8">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-card shadow-md ring-1 ring-border">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              loading="lazy"
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center bg-primary/15 text-2xl font-bold text-primary">
              {initials(instructor.name)}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-3 text-center">
        <h3 className="text-base font-bold text-ink group-hover:text-primary">{instructor.name}</h3>
        <p className="mt-1 text-xs font-semibold text-maroon">
          {instructor.title || "Instructor"}
        </p>
        {instructor.expertise ? (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{instructor.expertise}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-center gap-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {instructor.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {instructor.courses} Courses
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatCount(instructor.students)}
          </span>
        </div>
      </div>
    </Link>
  );
}
