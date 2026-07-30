import { CmsContentPage } from "@/components/cms/cms-content-page";
import { ensureCmsPagesHaveContent, getPublishedCmsPage } from "@/lib/cms/cms-service";

export default async function TermsPage() {
  await ensureCmsPagesHaveContent();
  const page = await getPublishedCmsPage("terms");

  return <CmsContentPage slug="terms" kicker="Legal" initialPage={page} />;
}
