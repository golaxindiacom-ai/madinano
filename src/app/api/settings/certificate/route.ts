import { jsonOk } from "@/lib/admin/api-utils";
import { getSettings } from "@/lib/admin/db";

export async function GET() {
  const settings = await getSettings();
  return jsonOk(settings.certificate);
}
