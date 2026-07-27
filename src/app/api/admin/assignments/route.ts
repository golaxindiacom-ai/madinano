import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  createAssignment,
  getAssignmentStats,
  listAssignmentLessons,
  listAssignments,
  listCoursesForAssignments,
} from "@/lib/admin/assignment-service";
import type { AssignmentInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getAssignmentStats());
    }
    if (searchParams.get("courses") === "true") {
      return jsonOk(await listCoursesForAssignments());
    }
    const courseId = searchParams.get("courseId");
    if (searchParams.get("lessons") === "true" && courseId) {
      return jsonOk(await listAssignmentLessons(courseId));
    }
    const assignments = await listAssignments({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as AssignmentInput["status"] | "all") ?? "all",
      courseId: courseId ?? undefined,
      overdue: searchParams.get("overdue") === "true",
    });
    return jsonOk(assignments);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list assignments", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssignmentInput;
    const assignment = await createAssignment(body);
    return jsonOk(assignment, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create assignment", 400);
  }
}
