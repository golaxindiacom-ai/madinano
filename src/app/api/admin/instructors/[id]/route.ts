import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { deleteInstructor, getInstructorDetail, updateInstructor } from "@/lib/admin/instructor-service";
import type { InstructorInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getInstructorDetail(id);
    if (!detail) return jsonError("Instructor not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load instructor", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as InstructorInput;
    const instructor = await updateInstructor(id, body);
    if (!instructor) return jsonError("Instructor not found", 404);
    return jsonOk(instructor);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update instructor", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteInstructor(id);
    if (!ok) return jsonError("Instructor not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete instructor", 400);
  }
}
