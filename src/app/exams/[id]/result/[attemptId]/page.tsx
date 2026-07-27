import { Suspense } from "react";
import { ExamResultPage } from "@/components/exam/exam-result-page";

type Props = { params: Promise<{ id: string; attemptId: string }> };

export default async function ExamResultRoute({ params }: Props) {
  const { id, attemptId } = await params;
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ExamResultPage examId={id} attemptId={attemptId} />
    </Suspense>
  );
}
