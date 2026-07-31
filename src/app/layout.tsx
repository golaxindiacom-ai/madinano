import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const siteName = "Madinano";
const defaultTitle = `${siteName} — Premium Learning Management Platform`;
const defaultDescription =
  "Madinano Global Pvt. Ltd. is the world-class learning platform for ambitious learners. Live classes, expert mentors, and industry-recognised certificates.";
const ogDescription =
  "Live classes, expert mentors, and industry-recognised certificates. Learn today, lead tomorrow.";
const ogImage = "/images/madinano-logo.png";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: defaultTitle,
  description: defaultDescription,
  authors: [{ name: siteName }],
  applicationName: siteName,
  icons: {
    icon: [{ url: "/images/madinano-logo.png", type: "image/png" }],
    apple: [{ url: "/images/madinano-logo.png", type: "image/png" }],
  },
  openGraph: {
    title: defaultTitle,
    description: ogDescription,
    url: "/",
    siteName,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
