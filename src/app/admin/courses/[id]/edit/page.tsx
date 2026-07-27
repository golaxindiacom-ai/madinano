import { CourseBuilderPage } from "@/components/admin/course-builder-page";

type Props = { params: Promise<{ id: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params;
  return <CourseBuilderPage courseId={id} />;
}
