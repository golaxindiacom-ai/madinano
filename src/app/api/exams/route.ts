import { jsonOk } from "@/lib/admin/api-utils";
import { listActiveExams } from "@/lib/admin/exam-service";

export async function GET() {
  const exams = await listActiveExams();
  return jsonOk(exams);
}
