import { notFound } from "next/navigation";
import { ResourcePage } from "@/components/admin/resource-page";
import { AdminSettingsPage } from "@/components/admin/settings-page";
import { AdminBackupPage } from "@/components/admin/backup-page";
import { UsersPage } from "@/components/admin/users-page";
import { InstructorsPage } from "@/components/admin/instructors-page";
import { CoursesListPage } from "@/components/admin/courses-list-page";
import { CategoriesTreePage } from "@/components/admin/categories-tree-page";
import { LessonsListPage } from "@/components/admin/lessons-list-page";
import { AssignmentsListPage } from "@/components/admin/assignments-list-page";
import { QuizzesListPage } from "@/components/admin/quizzes-list-page";
import { ExamAttemptsPage } from "@/components/admin/exam-attempts-page";
import { CertificatesListPage } from "@/components/admin/certificates-list-page";
import { LiveClassesListPage } from "@/components/admin/live-classes-list-page";
import { PaymentsOrdersPage } from "@/components/admin/payments-orders-page";
import { OrdersListPage } from "@/components/admin/orders-list-page";
import { SubscriptionsListPage } from "@/components/admin/subscriptions-list-page";
import { RESOURCES, API_RESOURCE_MAP } from "@/lib/admin/resources";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [
    ...Object.keys(RESOURCES).map((key) => {
      const apiEntry = Object.entries(API_RESOURCE_MAP).find(([, v]) => v === key);
      return { slug: apiEntry?.[0] ?? key };
    }),
    { slug: "settings" },
    { slug: "backup" },
  ];
}

export default async function AdminSlugPage({ params }: Props) {
  const { slug } = await params;

  if (slug === "settings") return <AdminSettingsPage />;
  if (slug === "backup") return <AdminBackupPage />;
  if (slug === "users") return <UsersPage />;
  if (slug === "instructors") return <InstructorsPage />;
  if (slug === "courses") return <CoursesListPage />;
  if (slug === "categories") return <CategoriesTreePage />;
  if (slug === "lessons") return <LessonsListPage />;
  if (slug === "assignments") return <AssignmentsListPage />;
  if (slug === "quizzes") return <QuizzesListPage />;
  if (slug === "exam-attempts" || slug === "quiz-attempts") return <ExamAttemptsPage />;
  if (slug === "certificates") return <CertificatesListPage />;
  if (slug === "live-classes") return <LiveClassesListPage />;
  if (slug === "payments") return <PaymentsOrdersPage defaultTab="payments" />;
  if (slug === "orders") return <OrdersListPage />;
  if (slug === "subscriptions") return <SubscriptionsListPage />;

  const collectionKey = API_RESOURCE_MAP[slug];
  if (!collectionKey) notFound();

  const config = RESOURCES[collectionKey];
  if (!config) notFound();

  return <ResourcePage collectionKey={collectionKey} apiSlug={slug} />;
}
