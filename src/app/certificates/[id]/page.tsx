import { CertificateViewPage } from "@/components/exam/certificate-view-page";

type Props = { params: Promise<{ id: string }> };

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  return <CertificateViewPage certId={id} />;
}
