import { CertificateVerifyPage } from "@/components/exam/certificate-verify-page";

type Props = { params: Promise<{ certNo: string }> };

export default async function VerifyCertificatePage({ params }: Props) {
  const { certNo } = await params;
  return <CertificateVerifyPage certNo={certNo} />;
}
