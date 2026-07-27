import { QuizBuilderPage } from "@/components/admin/quiz-builder-page";

type Props = { params: Promise<{ id: string }> };

export default async function EditQuizPage({ params }: Props) {
  const { id } = await params;
  return <QuizBuilderPage quizId={id} />;
}
