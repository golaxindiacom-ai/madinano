import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteLesson,
  getLessonDetail,
  updateLesson,
  updateLessonStatus,
} from "@/lib/admin/lesson-service";
import type { Lesson, LessonInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getLessonDetail(id);
    if (!detail) return jsonError("Lesson not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load lesson", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as LessonInput;
    const lesson = await updateLesson(id, body);
    if (!lesson) return jsonError("Lesson not found", 404);
    return jsonOk(lesson);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update lesson", 400);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.status) {
      const lesson = await updateLessonStatus(id, body.status as Lesson["status"]);
      if (!lesson) return jsonError("Lesson not found", 404);
      return jsonOk(lesson);
    }
    return PUT(request, { params });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update lesson", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteLesson(id);
    if (!ok) return jsonError("Lesson not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete lesson", 400);
  }
}
