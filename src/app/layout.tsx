import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Navbharat Gurukulam — Premium Learning Management Platform",
  description:
    "Navbharat Gurukulam is the world-class learning platform for ambitious learners. Live classes, expert mentors, and industry-recognised certificates.",
  authors: [{ name: "Navbharat Gurukulam" }],
  icons: {
    icon: [{ url: "/images/ngrf-logo.png", type: "image/png" }],
    apple: [{ url: "/images/ngrf-logo.png", type: "image/png" }],
  },
  openGraph: {
    title: "Navbharat Gurukulam — Premium Learning Management Platform",
    description:
      "Live classes, expert mentors, and industry-recognised certificates. Learn today, lead tomorrow.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
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
