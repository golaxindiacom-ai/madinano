import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/admin/db";
import type { CmsPage, GalleryItem } from "@/lib/admin/types";

export async function getPublishedCmsPage(slug: string): Promise<CmsPage | null> {
  const db = await readDb();
  const normalized = slug.trim().toLowerCase();
  const page = db.cmsPages.find(
    (item) => item.slug.toLowerCase() === normalized && item.status === "published",
  );
  return page ?? null;
}

export async function listPublishedGallery(): Promise<GalleryItem[]> {
  const db = await readDb();
  return db.gallery.filter((item) => item.status === "published");
}

export async function ensureCmsPagesHaveContent() {
  const db = await readDb();
  let dirty = false;
  for (const page of db.cmsPages) {
    if (typeof page.content !== "string") {
      page.content = "";
      dirty = true;
    }
  }

  const ensure = (slug: string, title: string, content: string, excerpt: string) => {
    const existing = db.cmsPages.find((p) => p.slug === slug);
    if (!existing) {
      const ts = new Date().toISOString();
      db.cmsPages.push({
        id: randomUUID(),
        title,
        slug,
        status: "published",
        content,
        excerpt,
        seoTitle: title,
        seoDescription: excerpt,
        createdAt: ts,
        updatedAt: ts,
      });
      dirty = true;
      return;
    }
    if (!existing.content?.trim()) {
      existing.content = content;
      existing.excerpt = existing.excerpt || excerpt;
      existing.seoTitle = existing.seoTitle || title;
      existing.seoDescription = existing.seoDescription || excerpt;
      dirty = true;
    }
  };

  ensure(
    "about",
    "About Us",
    [
      "Madinano is a next-generation online learning platform dedicated to helping students, professionals, and organizations unlock their true potential.",
      "",
      "Our mission is to empower individuals through accessible, affordable, and high-quality education that helps them build skills, advance their careers, and create a better future.",
      "",
      "Our vision is to become a global leader in online education, recognized for our commitment to excellence, innovation, and transforming lives through learning.",
      "",
      "Why choose us:",
      "- Expert instructors from industry and academia",
      "- Flexible learning anytime, anywhere",
      "- High-quality, practical course content",
      "- Affordable premium education",
      "- Lifetime access to enrolled courses",
      "- A growing global learner community",
    ].join("\n"),
    "Empowering learners worldwide through research-led education.",
  );

  ensure(
    "privacy-policy",
    "Privacy Policy",
    [
      "1. Information we collect",
      "We collect account details (name, email, phone), billing address for purchases, course progress, exam attempts, and support messages you submit through the contact form.",
      "",
      "2. How we use your data",
      "Your data is used to create your account, process enrollments and payments, issue certificates, improve learning experiences, and respond to support requests.",
      "",
      "3. Sharing",
      "We do not sell personal data. Payment processors and essential service providers may receive limited information needed to complete transactions securely.",
      "",
      "4. Your choices",
      "You may update profile details from your dashboard or contact us to request account support.",
      "",
      "Last updated: July 2026",
    ].join("\n"),
    "How Madinano collects, uses, and protects your information.",
  );

  ensure(
    "terms",
    "Terms of Use",
    [
      "1. Accounts",
      "You must provide accurate information when creating an account. You are responsible for keeping your login credentials secure and for activity under your account.",
      "",
      "2. Course purchases",
      "Purchases grant personal learning access to the enrolled course content. Sharing account access or redistributing course materials is not allowed.",
      "",
      "3. Certificates & exams",
      "Certificates are issued only after meeting course/exam requirements. Proctoring rules and attempt limits apply where enabled by the instructor.",
      "",
      "4. Refunds",
      "Refund requests are reviewed case by case. Contact support within the applicable window with your order number.",
      "",
      "Last updated: July 2026",
    ].join("\n"),
    "Rules for using Madinano courses, exams, and platform services.",
  );

  if (dirty) await writeDb(db);
}
