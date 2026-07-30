import type { Metadata } from "next";
import { StudentShell } from "@/components/dashboard/student-shell";

export const metadata: Metadata = {
  title: "Dashboard — Navbharat Gurukulam",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
