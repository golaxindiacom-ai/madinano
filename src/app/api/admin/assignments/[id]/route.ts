import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteAssignment,
  getAssignmentDetail,
  updateAssignment,
  updateAssignmentStatus,
} from "@/lib/admin/assignment-service";
import type { Assignment, AssignmentInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getAssignmentDetail(id);
    if (!detail) return jsonError("Assignment not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load assignment", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as AssignmentInput;
    const assignment = await updateAssignment(id, body);
    if (!assignment) return jsonError("Assignment not found", 404);
    return jsonOk(assignment);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update assignment", 400);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.status) {
      const assignment = await updateAssignmentStatus(id, body.status as Assignment["status"]);
      if (!assignment) return jsonError("Assignment not found", 404);
      return jsonOk(assignment);
    }
    return PUT(request, { params });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update assignment", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteAssignment(id);
    if (!ok) return jsonError("Assignment not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete assignment", 400);
  }
}
