import { jsonOk } from "@/lib/admin/api-utils";
import { listPublicLiveClasses } from "@/lib/admin/live-class-service";

export async function GET() {
  const data = await listPublicLiveClasses();
  return jsonOk(data);
}
