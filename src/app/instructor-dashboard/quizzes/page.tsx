"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { images } from "@/lib/images";
import { QuizzesListPage } from "@/components/admin/quizzes-list-page";
import { resolveInstructorSession, type InstructorSession } from "@/lib/exam/instructor-session";
import { ArrowLeft, Plus } from "lucide-react";

export default function InstructorQuizzesPage() {
  const [instructor, setInstructor] = useState<InstructorSession | null>(null);

  useEffect(() => {
    resolveInstructorSession().then(setInstructor);
  }, []);

  if (!instructor) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/instructor-dashboard" className="flex items-center gap-2">
            <img src={images.logo} alt="" className="h-9 w-9 rounded-full object-cover" />
            <span className="text-sm font-bold text-ink">Instructor · Quiz Library</span>
          </Link>
          <Link href="/instructor-dashboard/quizzes/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Create Quiz
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/instructor-dashboard" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <QuizzesListPage basePath="/instructor-dashboard/quizzes" instructorId={instructor.instructorId || instructor.id || undefined} />
      </main>
    </div>
  );
}
