import { jsonOk } from "@/lib/admin/api-utils";
import { listPublicTestimonials } from "@/lib/admin/public-content-service";

export async function GET() {
  return jsonOk(await listPublicTestimonials());
}
