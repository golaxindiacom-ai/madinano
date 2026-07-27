import { Suspense } from "react";
import { ExamTakePage } from "@/components/exam/exam-take-page";

type Props = { params: Promise<{ id: string }> };

export default async function ExamTakeRoute({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <ExamTakePage examId={id} />
    </Suspense>
  );
}
