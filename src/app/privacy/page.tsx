import { CmsContentPage } from "@/components/cms/cms-content-page";
import { ensureCmsPagesHaveContent, getPublishedCmsPage } from "@/lib/cms/cms-service";

export default async function PrivacyPage() {
  await ensureCmsPagesHaveContent();
  const page = await getPublishedCmsPage("privacy-policy");

  return <CmsContentPage slug="privacy-policy" kicker="Legal" initialPage={page} />;
}
