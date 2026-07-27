import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  deleteCertificate,
  getCertificateDetail,
  updateCertificateStatus,
} from "@/lib/admin/certificate-service";
import type { Certificate } from "@/lib/admin/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getCertificateDetail(id);
    if (!detail) return jsonError("Certificate not found", 404);
    return jsonOk(detail);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load certificate", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.status || !["issued", "revoked"].includes(body.status)) {
      return jsonError("Invalid status", 400);
    }
    const cert = await updateCertificateStatus(id, body.status as Certificate["status"]);
    if (!cert) return jsonError("Certificate not found", 404);
    return jsonOk(cert);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update certificate", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteCertificate(id);
    if (!ok) return jsonError("Certificate not found", 404);
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete certificate", 400);
  }
}
