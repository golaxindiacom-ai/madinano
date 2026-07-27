import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  createLiveClass,
  getLiveClassStats,
  getPlatformOptions,
  listCoursesForLiveClasses,
  listLiveClasses,
} from "@/lib/admin/live-class-service";
import type { LiveClass, LiveClassInput, LiveClassPlatform } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getLiveClassStats());
    }
    if (searchParams.get("courses") === "true") {
      return jsonOk(await listCoursesForLiveClasses());
    }
    if (searchParams.get("platforms") === "true") {
      return jsonOk(getPlatformOptions());
    }

    const classes = await listLiveClasses({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as LiveClass["status"] | "all") ?? "all",
      courseId: searchParams.get("courseId") ?? undefined,
      platform: (searchParams.get("platform") as LiveClassPlatform | "all") ?? "all",
      upcoming: searchParams.get("upcoming") === "true",
    });
    return jsonOk(classes);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list live classes", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LiveClassInput;
    const liveClass = await createLiveClass(body);
    return jsonOk(liveClass, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create live class", 400);
  }
}
