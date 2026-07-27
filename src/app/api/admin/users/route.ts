import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { createUser, getUserStats, listUsers } from "@/lib/admin/user-service";
import type { UserInput } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getUserStats());
    }
    const users = await listUsers({
      search: searchParams.get("search") ?? undefined,
      role: (searchParams.get("role") as UserInput["role"] | "all") ?? "all",
      status: (searchParams.get("status") as UserInput["status"] | "all") ?? "all",
    });
    return jsonOk(users);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list users", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UserInput;
    const user = await createUser(body);
    return jsonOk(user, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create user", 400);
  }
}
