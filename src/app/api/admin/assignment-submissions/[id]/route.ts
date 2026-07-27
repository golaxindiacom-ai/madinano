import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { gradeSubmission } from "@/lib/admin/assignment-service";
import type { GradeSubmissionInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as GradeSubmissionInput;
    const submission = await gradeSubmission(id, body);
    if (!submission) return jsonError("Submission not found", 404);
    return jsonOk(submission);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to grade submission", 400);
  }
}
