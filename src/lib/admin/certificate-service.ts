import { readDb, writeDb } from "./db";
import { normalizeCertificate } from "./exam-engine";
import type {
  AdminDatabase,
  Certificate,
  CertificateDetailPayload,
  CertificateListItem,
  CertificateStats,
  CertificateTemplateId,
} from "./types";

const now = () => new Date().toISOString();

const TEMPLATE_LABELS: Record<CertificateTemplateId, string> = {
  "classic-maroon": "Classic Maroon",
  "royal-gold": "Royal Gold",
  "modern-minimal": "Modern Minimal",
  "elegant-forest": "Elegant Forest",
  "premium-dark": "Premium Dark",
};

function enrichCertificate(db: AdminDatabase, cert: Certificate): CertificateListItem {
  return {
    ...cert,
    templateLabel: TEMPLATE_LABELS[cert.template ?? "classic-maroon"] ?? cert.template ?? "Classic",
    isValid: cert.status === "issued",
  };
}

export type ListCertificatesOptions = {
  search?: string;
  status?: Certificate["status"] | "all";
  studentId?: string;
  template?: CertificateTemplateId | "all";
};

export async function getCertificateStats(): Promise<CertificateStats> {
  const db = await readDb();
  const certs = db.certificates.map((c) =>
    normalizeCertificate(c as unknown as Record<string, unknown>),
  );
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const issued = certs.filter((c) => c.status === "issued");
  const studentIds = new Set(certs.map((c) => c.studentId));

  return {
    total: certs.length,
    issued: issued.length,
    revoked: certs.filter((c) => c.status === "revoked").length,
    thisMonth: certs.filter((c) => new Date(c.issuedAt) >= monthStart).length,
    uniqueStudents: studentIds.size,
    averageScore: issued.length
      ? Math.round(issued.reduce((s, c) => s + c.percentage, 0) / issued.length)
      : 0,
  };
}

export async function listCertificates(
  options: ListCertificatesOptions = {},
): Promise<CertificateListItem[]> {
  const db = await readDb();
  let certs = db.certificates.map((c) =>
    normalizeCertificate(c as unknown as Record<string, unknown>),
  );

  if (options.status && options.status !== "all") {
    certs = certs.filter((c) => c.status === options.status);
  }
  if (options.studentId) {
    certs = certs.filter((c) => c.studentId === options.studentId);
  }
  if (options.template && options.template !== "all") {
    certs = certs.filter((c) => (c.template ?? "classic-maroon") === options.template);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    certs = certs.filter((c) =>
      [c.certificateNo, c.studentName, c.studentEmail, c.courseTitle, c.quizTitle].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }

  return certs
    .map((c) => enrichCertificate(db, c))
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
}

export async function getCertificateDetail(id: string): Promise<CertificateDetailPayload | null> {
  const db = await readDb();
  const raw = db.certificates.find((c) => c.id === id);
  if (!raw) return null;

  const certificate = enrichCertificate(
    db,
    normalizeCertificate(raw as unknown as Record<string, unknown>),
  );
  const attemptRaw = db.quizAttempts.find((a) => a.id === certificate.attemptId);

  return {
    certificate,
    attempt: attemptRaw
      ? {
          id: attemptRaw.id,
          percentage: Number(attemptRaw.percentage ?? 0),
          passed: Boolean(attemptRaw.passed),
          submittedAt: attemptRaw.submittedAt ? String(attemptRaw.submittedAt) : undefined,
        }
      : undefined,
    verifyPath: `/certificates/verify/${certificate.certificateNo}`,
  };
}

export async function updateCertificateStatus(
  id: string,
  status: Certificate["status"],
): Promise<Certificate | null> {
  const db = await readDb();
  const idx = db.certificates.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  db.certificates[idx] = {
    ...db.certificates[idx],
    status,
    updatedAt: now(),
  };
  await writeDb(db);
  return normalizeCertificate(db.certificates[idx] as unknown as Record<string, unknown>);
}

export async function deleteCertificate(id: string): Promise<boolean> {
  const db = await readDb();
  const cert = db.certificates.find((c) => c.id === id);
  if (!cert) return false;

  const attemptIdx = db.quizAttempts.findIndex((a) => a.id === cert.attemptId);
  if (attemptIdx !== -1) {
    db.quizAttempts[attemptIdx] = {
      ...db.quizAttempts[attemptIdx],
      certificateId: undefined,
      updatedAt: now(),
    };
  }

  db.certificates = db.certificates.filter((c) => c.id !== id);
  await writeDb(db);
  return true;
}

export async function listStudentsForCertificates() {
  const db = await readDb();
  const studentIds = new Set(db.certificates.map((c) => c.studentId));
  return db.users
    .filter((u) => studentIds.has(u.id) || u.role === "student")
    .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTemplateOptions() {
  return Object.entries(TEMPLATE_LABELS).map(([value, label]) => ({ value, label }));
}
