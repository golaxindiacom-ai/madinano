import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import {
  getCertificateStats,
  getTemplateOptions,
  listCertificates,
  listStudentsForCertificates,
} from "@/lib/admin/certificate-service";
import type { Certificate, CertificateTemplateId } from "@/lib/admin/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("stats") === "true") {
      return jsonOk(await getCertificateStats());
    }
    if (searchParams.get("students") === "true") {
      return jsonOk(await listStudentsForCertificates());
    }
    if (searchParams.get("templates") === "true") {
      return jsonOk(getTemplateOptions());
    }

    const certs = await listCertificates({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as Certificate["status"] | "all") ?? "all",
      studentId: searchParams.get("studentId") ?? undefined,
      template: (searchParams.get("template") as CertificateTemplateId | "all") ?? "all",
    });
    return jsonOk(certs);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list certificates", 500);
  }
}
