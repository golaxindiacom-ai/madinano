import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteLiveClass,
  getLiveClassDetail,
  updateLiveClass,
  updateLiveClassStatus,
} from "@/lib/admin/live-class-service";
import type { LiveClass, LiveClassInput } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getLiveClassDetail(id);
    if (!detail) return jsonError("Live class not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load live class", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as LiveClassInput;
    const liveClass = await updateLiveClass(id, body);
    if (!liveClass) return jsonError("Live class not found", 404);
    return jsonOk(liveClass);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update live class", 400);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.status) {
      const liveClass = await updateLiveClassStatus(id, body.status as LiveClass["status"]);
      if (!liveClass) return jsonError("Live class not found", 404);
      return jsonOk(liveClass);
    }
    return PUT(request, { params });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update live class", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteLiveClass(id);
    if (!ok) return jsonError("Live class not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete live class", 400);
  }
}
