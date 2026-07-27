"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { QuizBuilderPage } from "@/components/admin/quiz-builder-page";
import { resolveInstructorSession, type InstructorSession } from "@/lib/exam/instructor-session";
import { ArrowLeft } from "lucide-react";

export default function InstructorEditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [instructor, setInstructor] = useState<InstructorSession | null>(null);

  useEffect(() => {
    resolveInstructorSession().then(setInstructor);
  }, []);

  if (!instructor) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/instructor-dashboard/quizzes" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to My Quizzes
        </Link>
        <QuizBuilderPage quizId={id} basePath="/instructor-dashboard/quizzes" instructorId={instructor.instructorId || instructor.id || undefined} />
      </div>
    </div>
  );
}
