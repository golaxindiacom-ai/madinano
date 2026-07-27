import { Suspense } from "react";
import { CourseLearnPage } from "@/components/course/course-learn-page";

type Props = { params: Promise<{ id: string }> };

export default async function LearnCoursePage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CourseLearnPage courseId={id} />
    </Suspense>
  );
}
