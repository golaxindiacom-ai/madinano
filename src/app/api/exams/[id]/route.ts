import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getExamForStudent } from "@/lib/admin/exam-service";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const exam = await getExamForStudent(id);
  if (!exam) return jsonError("Exam not found", 404);
  return jsonOk(exam);
}
