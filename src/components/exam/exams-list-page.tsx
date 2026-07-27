"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileQuestion, ArrowRight } from "lucide-react";
import { SiteHeader, SiteTopBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { PageBand, PageHero } from "@/components/page-hero";

type ExamItem = {
  id: string;
  title: string;
  description?: string;
  courseTitle?: string;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  questions: number;
};

export function ExamsListPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((j) => setExams(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteTopBar />
      <SiteHeader />
      <PageHero
        kicker="Assessments"
        title={
          <>
            Online <span className="text-primary">Examinations</span>
          </>
        }
        subtitle="Take exams, get instant results, and earn verifiable certificates."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Exams" }]}
      />
      <PageBand tone="process">
        <Container>
          {loading ? (
            <p className="text-muted-foreground">Loading exams...</p>
          ) : exams.length === 0 ? (
            <p className="text-muted-foreground">No active exams available.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-float"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileQuestion className="h-5 w-5" />
                  </div>
                  <h2 className="font-bold text-ink">{exam.title}</h2>
                  {exam.courseTitle ? (
                    <p className="mt-1 text-xs text-muted-foreground">{exam.courseTitle}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.durationMinutes} min
                    </span>
                    <span>{exam.questions} questions</span>
                    <span>{exam.totalMarks} marks</span>
                    <span>Pass: {exam.passingPercentage}%</span>
                  </div>
                  <Link
                    href={`/exams/${exam.id}`}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary"
                  >
                    Start Exam <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Container>
      </PageBand>
      <SiteFooter />
    </div>
  );
}
