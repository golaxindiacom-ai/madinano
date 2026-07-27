import { Suspense } from "react";
import { ExamIntroPage } from "@/components/exam/exam-intro-page";

type Props = { params: Promise<{ id: string }> };

export default async function ExamDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading...</p>}>
      <ExamIntroPage examId={id} />
    </Suspense>
  );
}
