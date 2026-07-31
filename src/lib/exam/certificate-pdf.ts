import type { Certificate } from "@/lib/admin/types";

/** Generate certificate PDF client-side using jsPDF */
export async function downloadCertificatePdf(cert: Certificate) {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(180, 120, 40);
  doc.setLineWidth(2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, w - 28, h - 28);

  // Header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(180, 120, 40);
  doc.text("CERTIFICATE OF ACHIEVEMENT", w / 2, 32, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("Madinano", w / 2, 48, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("This is to certify that", w / 2, 62, { align: "center" });

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(cert.studentName, w / 2, 76, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("has successfully completed the examination", w / 2, 88, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34);
  doc.text(cert.quizTitle, w / 2, 100, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(cert.courseTitle, w / 2, 108, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Score: ${cert.percentage}% (${cert.score} marks)`, 30, 125);
  doc.text(
    `Issued: ${new Date(cert.issuedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}`,
    30,
    133,
  );
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text(`Certificate No: ${cert.certificateNo}`, 30, 141);

  if (cert.qrCodeDataUrl) {
    doc.addImage(cert.qrCodeDataUrl, "PNG", w - 55, 115, 35, 35);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Scan to verify", w - 37.5, 154, { align: "center" });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(cert.verifyUrl, w / 2, h - 18, { align: "center" });

  doc.save(`${cert.certificateNo}.pdf`);
}

/** html2canvas fallback for pixel-perfect certificate from DOM */
export async function downloadCertificatePdfFromElement(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Certificate element not found");

  const html2canvas = (await import("html2canvas")).default;
  const { default: jsPDF } = await import("jspdf");

  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#fffefb" });
  const img = canvas.toDataURL("image/png");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.addImage(img, "PNG", 0, 0, w, h);
  doc.save(filename);
}
