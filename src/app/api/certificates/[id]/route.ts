import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { getCertificateById } from "@/lib/admin/exam-service";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const cert = await getCertificateById(id);
  if (!cert) return jsonError("Certificate not found", 404);
  return jsonOk(cert);
}
