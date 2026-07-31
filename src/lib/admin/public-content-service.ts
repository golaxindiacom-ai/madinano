import { readDb } from "./db";
import { normalizeCourse } from "./course-builder";
import { listPublicLiveClasses } from "./live-class-service";
import { images } from "@/lib/images";
import { mergeAppSettings } from "@/lib/certificate-settings";
import type {
  Blog,
  Course,
  HomePagePayload,
  Instructor,
  InstructorDashboardPayload,
  PublicBlogCard,
  PublicCourseCard,
  PublicInstructorCard,
  StudentDashboardPayload,
} from "./types";

const COURSE_THUMBS = [
  images.courseWeb,
  images.courseData,
  images.courseDesign,
  images.courseMkt,
  images.courseMobile,
  images.courseBiz,
];

const INSTRUCTOR_AVATARS = [images.inst1, images.inst2, images.inst3, images.inst4];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function courseThumb(course: Course, index: number) {
  return course.thumbnailUrl || COURSE_THUMBS[index % COURSE_THUMBS.length];
}

function instructorAvatar(inst: Instructor, index: number) {
  return inst.avatarUrl || INSTRUCTOR_AVATARS[index % INSTRUCTOR_AVATARS.length];
}

function toPublicCourse(
  course: Course,
  instructorName: string,
  categoryName: string,
  lessonCount: number,
  index: number,
): PublicCourseCard {
  const original = course.originalPrice || course.sellingPrice;
  const selling = course.sellingPrice || course.price || 0;
  const discountPercent =
    original > selling ? Math.round(((original - selling) / original) * 100) : 0;

  return {
    id: course.id,
    title: course.title,
    shortDescription: course.shortDescription,
    instructorName,
    instructorId: course.instructorId,
    categoryName,
    categoryId: course.categoryId,
    originalPrice: original,
    sellingPrice: selling,
    discountPercent,
    enrollments: course.enrollments,
    rating: course.rating,
    level: course.level,
    mode: course.mode,
    duration: course.duration,
    thumbnailUrl: courseThumb(course, index),
    lessonCount,
  };
}

function toPublicInstructor(inst: Instructor, index: number): PublicInstructorCard {
  return {
    id: inst.id,
    name: inst.name,
    slug: inst.slug || slugify(inst.name),
    title: inst.title || inst.expertise,
    expertise: inst.expertise,
    bio: inst.bio || `Expert in ${inst.expertise} with years of teaching experience.`,
    courses: inst.courses,
    students: inst.students,
    rating: inst.rating,
    avatarUrl: instructorAvatar(inst, index),
    country: inst.country,
  };
}

function toPublicBlog(blog: Blog): PublicBlogCard {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug || slugify(blog.title),
    category: blog.category,
    author: blog.author,
    excerpt: blog.excerpt || `Read insights on ${blog.title}.`,
    coverImage: blog.coverImage || images.courseWeb,
    readTime: blog.readTime || "5 min read",
    publishedAt: blog.publishedAt || blog.createdAt,
  };
}

export type ListPublicCoursesOptions = {
  search?: string;
  categoryId?: string;
  level?: string;
  sort?: "popular" | "rating" | "newest" | "price-low" | "price-high";
  limit?: number;
};

export async function listPublicCourses(options: ListPublicCoursesOptions = {}) {
  const db = await readDb();
  let courses = db.courses
    .map((c) => normalizeCourse(c as unknown as Record<string, unknown>))
    .filter((c) => c.status === "published");

  if (options.categoryId) {
    courses = courses.filter(
      (c) =>
        c.categoryId === options.categoryId ||
        c.mainCategoryId === options.categoryId ||
        c.subCategoryId === options.categoryId ||
        c.subSubCategoryId === options.categoryId,
    );
  }
  if (options.level && options.level !== "all") {
    courses = courses.filter((c) => c.level === options.level);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    courses = courses.filter((c) =>
      [c.title, c.shortDescription, c.description].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }

  switch (options.sort) {
    case "rating":
      courses.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      courses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "price-low":
      courses.sort((a, b) => a.sellingPrice - b.sellingPrice);
      break;
    case "price-high":
      courses.sort((a, b) => b.sellingPrice - a.sellingPrice);
      break;
    default:
      courses.sort((a, b) => b.enrollments - a.enrollments);
  }

  if (options.limit) courses = courses.slice(0, options.limit);

  return courses.map((course, index) => {
    const instructor = db.instructors.find((i) => i.id === course.instructorId);
    const category = db.categories.find((c) => c.id === course.categoryId);
    const lessonCount = db.lessons.filter((l) => l.courseId === course.id).length;
    return toPublicCourse(
      course,
      instructor?.name ?? "Instructor",
      category?.name ?? "General",
      lessonCount,
      index,
    );
  });
}

export async function getPublicCourse(id: string) {
  const db = await readDb();
  const raw = db.courses.find((c) => c.id === id);
  if (!raw) return null;
  const course = normalizeCourse(raw as unknown as Record<string, unknown>);
  if (course.status !== "published") return null;

  const instructor = db.instructors.find((i) => i.id === course.instructorId);
  const category = db.categories.find((c) => c.id === course.categoryId);
  const lessons = db.lessons.filter((l) => l.courseId === course.id);
  const index = db.courses.findIndex((c) => c.id === id);

  return {
    ...toPublicCourse(
      course,
      instructor?.name ?? "Instructor",
      category?.name ?? "General",
      lessons.length,
      Math.max(0, index),
    ),
    description: course.description,
    requirements: course.requirements ?? [],
    outcomes: course.outcomes ?? [],
    curriculum: course.curriculum,
    language: course.language,
    instructor: instructor
      ? toPublicInstructor(instructor, Math.max(0, db.instructors.findIndex((i) => i.id === instructor.id)))
      : null,
  };
}

export async function listPublicCategories() {
  const db = await readDb();
  const published = db.courses.filter((c) => c.status === "published");

  return db.categories
    .filter((c) => c.status === "active" && (c.level === 1 || c.level === 2))
    .map((c) => {
      const courseCount = published.filter(
        (course) =>
          course.categoryId === c.id ||
          course.mainCategoryId === c.id ||
          course.subCategoryId === c.id ||
          course.subSubCategoryId === c.id,
      ).length;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        level: c.level,
        parentId: c.parentId,
        courseCount,
        description: c.description,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listPublicInstructors(limit?: number) {
  const db = await readDb();
  let instructors = db.instructors.filter((i) => i.status === "active");
  if (limit) instructors = instructors.slice(0, limit);
  return instructors.map((inst, i) => toPublicInstructor(inst, i));
}

export async function getPublicInstructorBySlug(slug: string) {
  const db = await readDb();
  const instructors = db.instructors.filter((i) => i.status === "active");
  const index = instructors.findIndex(
    (i) => (i.slug || slugify(i.name)) === slug || i.id === slug,
  );
  if (index === -1) return null;

  const instructor = instructors[index];
  const courses = await listPublicCourses({});
  const theirCourses = courses.filter((c) => c.instructorId === instructor.id);

  return {
    ...toPublicInstructor(instructor, index),
    courses: theirCourses,
    email: instructor.email,
  };
}

export async function listPublicBlogs(limit?: number) {
  const db = await readDb();
  let blogs = db.blogs
    .filter((b) => b.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime(),
    );
  if (limit) blogs = blogs.slice(0, limit);
  return blogs.map(toPublicBlog);
}

export async function getPublicBlogBySlug(slug: string) {
  const db = await readDb();
  const blog = db.blogs.find(
    (b) =>
      b.status === "published" &&
      (b.slug === slug || b.id === slug || slugify(b.title) === slug),
  );
  if (!blog) return null;

  return {
    ...toPublicBlog(blog),
    content: blog.content || blog.excerpt || "",
  };
}

export async function listPublicTestimonials() {
  const db = await readDb();
  return db.testimonials.filter((t) => t.status === "published");
}

export async function listPublicFaqs() {
  const db = await readDb();
  return db.faq
    .filter((f) => f.status === "published")
    .sort((a, b) => a.order - b.order);
}

export async function getPublicSettings() {
  const db = await readDb();
  return {
    siteName: db.settings.siteName,
    siteEmail: db.settings.siteEmail,
    sitePhone: db.settings.sitePhone,
    currency: db.settings.currency,
  };
}

export async function getHomePageData(): Promise<HomePagePayload> {
  const db = await readDb();
  const [featuredCourses, instructors, liveData, testimonials, blogs, faqs, categories] =
    await Promise.all([
      listPublicCourses({ sort: "popular", limit: 6 }),
      listPublicInstructors(4),
      listPublicLiveClasses(),
      listPublicTestimonials(),
      listPublicBlogs(3),
      listPublicFaqs(),
      listPublicCategories(),
    ]);

  const publishedCourses = db.courses.filter((c) => c.status === "published");
  const settings = mergeAppSettings(db.settings);

  return {
    stats: {
      students: db.users.filter((u) => u.role === "student").length || db.enrollments.length,
      instructors: db.instructors.filter((i) => i.status === "active").length,
      courses: publishedCourses.length,
      certificates: db.certificates.filter((c) => c.status === "issued").length,
    },
    categories: categories.filter((c) => c.level === 1 || c.level === 2).slice(0, 8),
    featuredCourses,
    instructors,
    liveClasses: liveData.upcoming.slice(0, 3),
    testimonials,
    blogs,
    faqs,
    cms: settings.cms.home,
  };
}

export async function getStudentDashboard(userId: string): Promise<StudentDashboardPayload> {
  const db = await readDb();
  const student = db.users.find((u) => u.id === userId) ?? {
    id: userId,
    name: "Student",
    email: "",
  };

  const enrollments = (db.enrollments ?? []).filter(
    (e) => e.userId === userId && e.status !== "dropped",
  );
  const completed = enrollments.filter((e) => e.status === "completed" || e.progress >= 100);
  const certificates = db.certificates.filter(
    (c) => c.studentId === userId && c.status === "issued",
  );

  const myCourses = enrollments.map((e) => {
    const courseRaw = db.courses.find((c) => c.id === e.courseId);
    const course = courseRaw
      ? normalizeCourse(courseRaw as unknown as Record<string, unknown>)
      : null;
    const idx = db.courses.findIndex((c) => c.id === e.courseId);
    return {
      id: e.id,
      courseId: e.courseId,
      title: e.courseTitle || course?.title || "Course",
      progress: e.progress,
      status: e.status,
      thumbnailUrl: course ? courseThumb(course, Math.max(0, idx)) : images.courseWeb,
      duration: course?.duration ?? "",
    };
  });

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const assignments = db.assignments
    .filter((a) => enrolledCourseIds.has(a.courseId) && a.status === "open")
    .map((a) => {
      const course = db.courses.find((c) => c.id === a.courseId);
      return {
        id: a.id,
        title: a.title,
        courseTitle: course?.title ?? "Course",
        dueDate: a.dueDate,
        status: a.status,
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const liveData = await listPublicLiveClasses();
  const upcomingLive =
    liveData.upcoming.find((l) => l.status === "live" || l.status === "scheduled") ?? null;

  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
    : 0;

  return {
    student: { id: student.id, name: student.name, email: student.email },
    kpis: {
      enrolledCourses: enrollments.length,
      completedCourses: completed.length,
      certificates: certificates.length,
      averageProgress,
    },
    myCourses,
    assignments,
    upcomingLive,
    certificates: certificates.length,
  };
}

export async function getInstructorDashboard(
  slugOrId = "john-smith",
): Promise<InstructorDashboardPayload | null> {
  const db = await readDb();
  const instructor =
    db.instructors.find((i) => i.id === slugOrId || i.slug === slugOrId) ??
    db.instructors.find((i) => i.status === "active") ??
    null;

  if (!instructor) return null;

  const courses = db.courses.filter((c) => c.instructorId === instructor.id);
  const courseIds = new Set(courses.map((c) => c.id));
  const enrollments = (db.enrollments ?? []).filter((e) => courseIds.has(e.courseId));
  const payments = (db.payments ?? []).filter(
    (p) => p.status === "completed" && !!p.courseId && courseIds.has(p.courseId),
  );
  const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const reviews = Math.max(instructor.students, enrollments.length);

  const myCourses = courses.map((course, index) => {
    const normalized = normalizeCourse(course as unknown as Record<string, unknown>);
    const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
    const coursePayments = payments.filter((p) => p.courseId === course.id);
    return {
      id: course.id,
      title: course.title,
      students: courseEnrollments.length || course.enrollments || 0,
      rating: course.rating || instructor.rating,
      earnings: coursePayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      status: course.status === "published" ? "Published" : course.status === "draft" ? "Draft" : course.status,
      thumbnailUrl: courseThumb(normalized, index),
    };
  });

  const recentStudents = enrollments
    .slice()
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
    .slice(0, 6)
    .map((enrollment) => {
      const user = db.users.find((u) => u.id === enrollment.userId);
      return {
        id: enrollment.id,
        name: user?.name || "Student",
        courseTitle: enrollment.courseTitle || "Course",
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
      };
    });

  const revenueByMonth = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthPayments = payments.filter((p) => {
      const date = new Date(p.createdAt || "");
      return !Number.isNaN(date.getTime()) && date.getMonth() === monthIndex;
    });
    return monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  });

  const linkedUser = db.users.find((u) => u.instructorId === instructor.id);

  return {
    instructor: {
      id: instructor.id,
      name: instructor.name,
      title: instructor.title || instructor.expertise || "Instructor",
      email: linkedUser?.email,
      avatarUrl: instructor.avatarUrl,
      rating: instructor.rating,
    },
    kpis: {
      totalStudents: instructor.students || enrollments.length,
      activeCourses: courses.filter((c) => c.status === "published").length,
      totalEarnings,
      avgRating: instructor.rating,
      reviews,
    },
    myCourses,
    recentStudents,
    revenueByMonth,
  };
}

export async function submitContact(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  if (!input.name?.trim()) throw new Error("Name is required");
  if (!input.email?.trim()) throw new Error("Email is required");
  if (!input.message?.trim()) throw new Error("Message is required");

  const db = await readDb();
  const { writeDb } = await import("./db");
  const { pushActivity, queueEmail } = await import("@/lib/notifications/notification-service");
  const subject = input.subject?.trim() || "No subject";
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  pushActivity(db, {
    message: `Contact form: ${name} (${email}) — ${subject}`,
    type: "contact",
    audience: "admin",
    href: "/admin",
  });
  await writeDb(db);

  const siteEmail = db.settings?.siteEmail || "support@madinano.com";
  await queueEmail({
    to: siteEmail,
    subject: `[Contact] ${subject}`,
    body: `New contact message from ${name} <${email}>\n\nSubject: ${subject}\n\n${message}`,
    relatedType: "contact",
  });
  await queueEmail({
    to: email,
    subject: "We received your message — Madinano",
    body: `Hi ${name},\n\nThanks for contacting Madinano. We received your message and will reply soon.\n\nYour message:\n${message}\n\n— Madinano Support`,
    relatedType: "contact-ack",
  });

  return { received: true, message: "Thank you! We will get back to you soon." };
}
