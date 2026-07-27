import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { verifyCertificate } from "@/lib/admin/exam-service";

type Props = { params: Promise<{ certNo: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { certNo } = await params;
  const cert = await verifyCertificate(certNo);
  if (!cert) return jsonError("Certificate not found", 404);
  return jsonOk(cert);
}
