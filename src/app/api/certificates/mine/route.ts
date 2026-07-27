import { jsonError, jsonOk } from "@/lib/admin/api-utils";
import { readDb } from "@/lib/admin/db";
import { normalizeCertificate } from "@/lib/admin/exam-engine";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) return jsonError("Please login to view certificates", 401);

  const db = await readDb();
  const items = db.certificates
    .map((c) => normalizeCertificate(c as unknown as Record<string, unknown>))
    .filter((c) => c.studentId === userId && c.status === "issued")
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  return jsonOk(items);
}
