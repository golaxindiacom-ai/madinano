import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { createInstructor, getInstructorStats, listInstructors } from "@/lib/admin/instructor-service";
import type { InstructorInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getInstructorStats());
    }
    const instructors = await listInstructors({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as InstructorInput["status"] | "all") ?? "all",
    });
    return jsonOk(instructors);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list instructors", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InstructorInput;
    const instructor = await createInstructor(body);
    return jsonOk(instructor, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create instructor", 400);
  }
}
