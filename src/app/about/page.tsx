import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { CmsContentPage } from "@/components/cms/cms-content-page";
import { ensureCmsPagesHaveContent, getPublishedCmsPage } from "@/lib/cms/cms-service";

export default async function AboutPage() {
  await ensureCmsPagesHaveContent();
  const page = await getPublishedCmsPage("about");

  return (
    <CmsContentPage slug="about" kicker="About Us" initialPage={page}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-95"
        >
          Explore Courses <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-ink hover:border-primary"
        >
          <Mail className="h-4 w-4" /> Contact
        </Link>
      </div>
    </CmsContentPage>
  );
}
