import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FolderTree,
  FileText,
  ClipboardList,
  HelpCircle,
  Award,
  Video,
  CreditCard,
  ShoppingCart,
  Repeat,
  TicketPercent,
  Newspaper,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  FileCode,
  Settings,
  ShieldCheck,
  ScrollText,
  DatabaseBackup,
  Eye,
} from "lucide-react";
import type { CollectionKey } from "./types";

export type FieldType = "text" | "email" | "number" | "select" | "textarea" | "date" | "checkbox";

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

export type ResourceConfig = {
  key: CollectionKey;
  label: string;
  singular: string;
  icon: typeof Users;
  href: string;
  section?: string;
  readOnly?: boolean;
  columns: { key: string; label: string }[];
  fields: FieldConfig[];
};

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    section: "MANAGEMENT",
    items: [
      { key: "users", label: "Users", href: "/admin/users", icon: Users },
      { key: "instructors", label: "Instructors", href: "/admin/instructors", icon: GraduationCap },
      { key: "courses", label: "Courses", href: "/admin/courses", icon: BookOpen },
      { key: "categories", label: "Categories", href: "/admin/categories", icon: FolderTree },
      { key: "lessons", label: "Lessons", href: "/admin/lessons", icon: FileText },
      { key: "assignments", label: "Assignments", href: "/admin/assignments", icon: ClipboardList },
      { key: "quizzes", label: "Quizzes", href: "/admin/quizzes", icon: HelpCircle },
      { label: "Exam Attempts", href: "/admin/exam-attempts", icon: Eye },
      { key: "certificates", label: "Certificates", href: "/admin/certificates", icon: Award },
      { key: "liveClasses", label: "Live Classes", href: "/admin/live-classes", icon: Video },
    ],
  },
  {
    section: "FINANCIAL",
    items: [
      { key: "payments", label: "Payments", href: "/admin/payments", icon: CreditCard },
      { key: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { key: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: Repeat },
      { key: "coupons", label: "Coupons", href: "/admin/coupons", icon: TicketPercent },
    ],
  },
  {
    section: "CONTENT",
    items: [
      { key: "blogs", label: "Blogs", href: "/admin/blogs", icon: Newspaper },
      { key: "events", label: "Events", href: "/admin/events", icon: Calendar },
      { key: "testimonials", label: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
      { key: "gallery", label: "Gallery", href: "/admin/gallery", icon: ImageIcon },
      { key: "cmsPages", label: "CMS Pages", href: "/admin/cms-pages", icon: FileCode },
      { key: "faq", label: "FAQ", href: "/admin/faq", icon: HelpCircle },
      { key: "newsletterSubscribers", label: "Newsletter", href: "/admin/newsletter-subscribers", icon: Newspaper },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { key: "roles", label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
      { key: "systemLogs", label: "System Logs", href: "/admin/system-logs", icon: ScrollText, readOnly: true },
      { label: "Backup & Restore", href: "/admin/backup", icon: DatabaseBackup },
    ],
  },
] as const;

export const ADMIN_NAV_SECTIONS = ADMIN_NAV.slice(1) as unknown as Array<{
  section: string;
  items: Array<{
    label: string;
    href: string;
    icon: typeof Users;
    key?: CollectionKey;
    readOnly?: boolean;
  }>;
}>;

const statusOpts = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const RESOURCES: Record<string, ResourceConfig> = {
  users: {
    key: "users",
    label: "Users",
    singular: "User",
    icon: Users,
    href: "/admin/users",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "country", label: "Country" },
    ],
    fields: [
      { key: "name", label: "Full Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "role", label: "Role", type: "select", required: true, options: [
        { label: "Student", value: "student" },
        { label: "Instructor", value: "instructor" },
        { label: "Admin", value: "admin" },
      ]},
      { key: "status", label: "Status", type: "select", required: true, options: [
        ...statusOpts,
        { label: "Suspended", value: "suspended" },
      ]},
    ],
  },
  instructors: {
    key: "instructors",
    label: "Instructors",
    singular: "Instructor",
    icon: GraduationCap,
    href: "/admin/instructors",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "expertise", label: "Expertise" },
      { key: "courses", label: "Courses" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "expertise", label: "Expertise", type: "text", required: true },
      { key: "courses", label: "Courses", type: "number" },
      { key: "students", label: "Students", type: "number" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        ...statusOpts,
        { label: "Pending", value: "pending" },
      ]},
    ],
  },
  categories: {
    key: "categories",
    label: "Categories",
    singular: "Category",
    icon: FolderTree,
    href: "/admin/categories",
    columns: [
      { key: "name", label: "Name" },
      { key: "level", label: "Level" },
      { key: "slug", label: "Slug" },
      { key: "parentId", label: "Parent" },
      { key: "courseCount", label: "Courses" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "level", label: "Level", type: "select", options: [
        { label: "Main Category", value: "1" },
        { label: "Sub Category", value: "2" },
        { label: "Sub-Sub Category", value: "3" },
      ]},
      { key: "parentId", label: "Parent ID", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "order", label: "Order", type: "number" },
      { key: "courseCount", label: "Course Count", type: "number" },
      { key: "status", label: "Status", type: "select", options: statusOpts },
    ],
  },
  courses: {
    key: "courses",
    label: "Courses",
    singular: "Course",
    icon: BookOpen,
    href: "/admin/courses",
    columns: [
      { key: "title", label: "Title" },
      { key: "mode", label: "Mode" },
      { key: "duration", label: "Duration" },
      { key: "price", label: "Price (₹)" },
      { key: "enrollments", label: "Enrollments" },
      { key: "level", label: "Level" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "categoryId", label: "Category ID", type: "text", required: true },
      { key: "instructorId", label: "Instructor ID", type: "text", required: true },
      { key: "originalPrice", label: "Original Price", type: "number" },
      { key: "sellingPrice", label: "Selling Price", type: "number", required: true },
      { key: "enrollments", label: "Enrollments", type: "number" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "level", label: "Level", type: "select", options: [
        { label: "Beginner", value: "beginner" },
        { label: "Intermediate", value: "intermediate" },
        { label: "Advanced", value: "advanced" },
      ]},
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ]},
    ],
  },
  lessons: {
    key: "lessons",
    label: "Lessons",
    singular: "Lesson",
    icon: FileText,
    href: "/admin/lessons",
    columns: [
      { key: "title", label: "Title" },
      { key: "courseId", label: "Course ID" },
      { key: "lessonType", label: "Type" },
      { key: "duration", label: "Duration" },
      { key: "order", label: "Order" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "courseId", label: "Course ID", type: "text", required: true },
      { key: "sectionId", label: "Section ID", type: "text" },
      { key: "lessonType", label: "Type", type: "select", options: [
        { label: "Video", value: "video" },
        { label: "Text", value: "text" },
        { label: "Quiz", value: "quiz" },
        { label: "Assignment", value: "assignment" },
      ]},
      { key: "videoUrl", label: "YouTube URL", type: "text" },
      { key: "duration", label: "Duration", type: "text" },
      { key: "order", label: "Order", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ]},
    ],
  },
  assignments: {
    key: "assignments",
    label: "Assignments",
    singular: "Assignment",
    icon: ClipboardList,
    href: "/admin/assignments",
    columns: [
      { key: "title", label: "Title" },
      { key: "courseId", label: "Course ID" },
      { key: "dueDate", label: "Due Date" },
      { key: "submissions", label: "Submissions" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "courseId", label: "Course ID", type: "text", required: true },
      { key: "dueDate", label: "Due Date", type: "date", required: true },
      { key: "submissions", label: "Submissions", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Open", value: "open" },
        { label: "Closed", value: "closed" },
      ]},
    ],
  },
  quizzes: {
    key: "quizzes",
    label: "Quizzes",
    singular: "Quiz",
    icon: HelpCircle,
    href: "/admin/quizzes",
    columns: [
      { key: "title", label: "Title" },
      { key: "courseId", label: "Course ID" },
      { key: "questions", label: "Questions" },
      { key: "attempts", label: "Attempts" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "courseId", label: "Course ID", type: "text", required: true },
      { key: "questions", label: "Questions", type: "number" },
      { key: "attempts", label: "Attempts", type: "number" },
      { key: "status", label: "Status", type: "select", options: statusOpts },
    ],
  },
  certificates: {
    key: "certificates",
    label: "Certificates",
    singular: "Certificate",
    icon: Award,
    href: "/admin/certificates",
    columns: [
      { key: "certificateNo", label: "Certificate No" },
      { key: "studentName", label: "Student" },
      { key: "courseTitle", label: "Course" },
      { key: "issuedAt", label: "Issued At" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "certificateNo", label: "Certificate No", type: "text", required: true },
      { key: "studentName", label: "Student Name", type: "text", required: true },
      { key: "courseTitle", label: "Course Title", type: "text", required: true },
      { key: "issuedAt", label: "Issued At", type: "date", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Issued", value: "issued" },
        { label: "Revoked", value: "revoked" },
      ]},
    ],
  },
  liveClasses: {
    key: "liveClasses",
    label: "Live Classes",
    singular: "Live Class",
    icon: Video,
    href: "/admin/live-classes",
    columns: [
      { key: "title", label: "Title" },
      { key: "platform", label: "Platform" },
      { key: "instructorName", label: "Instructor" },
      { key: "scheduledAt", label: "Scheduled" },
      { key: "enrolled", label: "Enrolled" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "courseId", label: "Course ID", type: "text" },
      { key: "instructorName", label: "Instructor", type: "text", required: true },
      { key: "platform", label: "Platform", type: "select", options: [
        { label: "Google Meet", value: "google_meet" },
        { label: "Zoom", value: "zoom" },
        { label: "YouTube Live", value: "youtube" },
      ]},
      { key: "meetingUrl", label: "Meeting URL", type: "text" },
      { key: "scheduledAt", label: "Scheduled At", type: "date", required: true },
      { key: "duration", label: "Duration", type: "text" },
      { key: "enrolled", label: "Enrolled", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Scheduled", value: "scheduled" },
        { label: "Live", value: "live" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ]},
    ],
  },
  payments: {
    key: "payments",
    label: "Payments",
    singular: "Payment",
    icon: CreditCard,
    href: "/admin/payments",
    columns: [
      { key: "orderId", label: "Order ID" },
      { key: "studentName", label: "Student" },
      { key: "amount", label: "Amount (₹)" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "orderId", label: "Order ID", type: "text", required: true },
      { key: "studentName", label: "Student Name", type: "text", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "method", label: "Method", type: "select", options: [
        { label: "Card", value: "card" },
        { label: "UPI", value: "upi" },
        { label: "PayPal", value: "paypal" },
        { label: "Bank", value: "bank" },
      ]},
      { key: "status", label: "Status", type: "select", options: [
        { label: "Completed", value: "completed" },
        { label: "Pending", value: "pending" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
      ]},
    ],
  },
  orders: {
    key: "orders",
    label: "Orders",
    singular: "Order",
    icon: ShoppingCart,
    href: "/admin/orders",
    columns: [
      { key: "orderNo", label: "Order No" },
      { key: "studentName", label: "Student" },
      { key: "courseTitle", label: "Course" },
      { key: "amount", label: "Amount (₹)" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "orderNo", label: "Order No", type: "text", required: true },
      { key: "studentName", label: "Student Name", type: "text", required: true },
      { key: "courseTitle", label: "Course Title", type: "text", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Completed", value: "completed" },
        { label: "Pending", value: "pending" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Refunded", value: "refunded" },
      ]},
    ],
  },
  subscriptions: {
    key: "subscriptions",
    label: "Subscriptions",
    singular: "Subscription",
    icon: Repeat,
    href: "/admin/subscriptions",
    columns: [
      { key: "studentName", label: "Student" },
      { key: "plan", label: "Plan" },
      { key: "amount", label: "Amount (₹)" },
      { key: "startDate", label: "Start" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "studentName", label: "Student Name", type: "text", required: true },
      { key: "plan", label: "Plan", type: "select", options: [
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
        { label: "Lifetime", value: "lifetime" },
      ]},
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "startDate", label: "Start Date", type: "date", required: true },
      { key: "endDate", label: "End Date", type: "date", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Active", value: "active" },
        { label: "Expired", value: "expired" },
        { label: "Cancelled", value: "cancelled" },
      ]},
    ],
  },
  coupons: {
    key: "coupons",
    label: "Coupons",
    singular: "Coupon",
    icon: TicketPercent,
    href: "/admin/coupons",
    columns: [
      { key: "code", label: "Code" },
      { key: "discount", label: "Discount" },
      { key: "discountType", label: "Type" },
      { key: "usedCount", label: "Used" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "code", label: "Code", type: "text", required: true },
      { key: "discount", label: "Discount", type: "number", required: true },
      { key: "discountType", label: "Type", type: "select", options: [
        { label: "Percent", value: "percent" },
        { label: "Fixed", value: "fixed" },
      ]},
      { key: "usageLimit", label: "Usage Limit", type: "number" },
      { key: "usedCount", label: "Used Count", type: "number" },
      { key: "expiresAt", label: "Expires At", type: "date", required: true },
      { key: "status", label: "Status", type: "select", options: [
        ...statusOpts,
        { label: "Expired", value: "expired" },
      ]},
    ],
  },
  blogs: {
    key: "blogs",
    label: "Blogs",
    singular: "Blog",
    icon: Newspaper,
    href: "/admin/blogs",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "author", label: "Author" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text" },
      { key: "category", label: "Category", type: "text", required: true },
      { key: "author", label: "Author", type: "text", required: true },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "content", label: "Content", type: "textarea" },
      { key: "coverImage", label: "Cover Image URL", type: "text" },
      { key: "readTime", label: "Read Time", type: "text" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ]},
    ],
  },
  events: {
    key: "events",
    label: "Events",
    singular: "Event",
    icon: Calendar,
    href: "/admin/events",
    columns: [
      { key: "title", label: "Title" },
      { key: "date", label: "Date" },
      { key: "location", label: "Location" },
      { key: "attendees", label: "Attendees" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "location", label: "Location", type: "text", required: true },
      { key: "attendees", label: "Attendees", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Upcoming", value: "upcoming" },
        { label: "Ongoing", value: "ongoing" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ]},
    ],
  },
  testimonials: {
    key: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    icon: MessageSquare,
    href: "/admin/testimonials",
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "role", label: "Role", type: "text", required: true },
      { key: "quote", label: "Quote", type: "textarea", required: true },
      { key: "rating", label: "Rating", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ]},
    ],
  },
  gallery: {
    key: "gallery",
    label: "Gallery",
    singular: "Gallery Item",
    icon: ImageIcon,
    href: "/admin/gallery",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "imageUrl", label: "Image URL" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "imageUrl", label: "Image URL", type: "text", required: true },
      { key: "category", label: "Category", type: "text", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ]},
    ],
  },
  cmsPages: {
    key: "cmsPages",
    label: "CMS Pages",
    singular: "CMS Page",
    icon: FileCode,
    href: "/admin/cms-pages",
    columns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true, placeholder: "about / privacy-policy / terms" },
      { key: "excerpt", label: "Excerpt / Subtitle", type: "textarea" },
      { key: "seoTitle", label: "SEO Title", type: "text" },
      { key: "seoDescription", label: "SEO Description", type: "textarea" },
      { key: "content", label: "Page Content", type: "textarea", required: true, placeholder: "Use blank lines between paragraphs. Lines starting with - become bullets." },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ]},
    ],
  },
  faq: {
    key: "faq",
    label: "FAQ",
    singular: "FAQ Item",
    icon: HelpCircle,
    href: "/admin/faq",
    columns: [
      { key: "question", label: "Question" },
      { key: "category", label: "Category" },
      { key: "order", label: "Order" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "question", label: "Question", type: "text", required: true },
      { key: "answer", label: "Answer", type: "textarea", required: true },
      { key: "category", label: "Category", type: "text", required: true },
      { key: "order", label: "Order", type: "number" },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ]},
    ],
  },
  newsletterSubscribers: {
    key: "newsletterSubscribers",
    label: "Newsletter",
    singular: "Subscriber",
    icon: Newspaper,
    href: "/admin/newsletter-subscribers",
    columns: [
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Subscribed" },
    ],
    fields: [
      { key: "email", label: "Email", type: "email", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { label: "Active", value: "active" },
        { label: "Unsubscribed", value: "unsubscribed" },
      ]},
    ],
  },
  roles: {
    key: "roles",
    label: "Roles & Permissions",
    singular: "Role",
    icon: ShieldCheck,
    href: "/admin/roles",
    columns: [
      { key: "name", label: "Name" },
      { key: "userCount", label: "Users" },
      { key: "permissions", label: "Permissions" },
    ],
    fields: [
      { key: "name", label: "Role Name", type: "text", required: true },
      { key: "permissions", label: "Permissions (comma separated)", type: "text", required: true },
      { key: "userCount", label: "User Count", type: "number" },
    ],
  },
  systemLogs: {
    key: "systemLogs",
    label: "System Logs",
    singular: "Log",
    icon: ScrollText,
    href: "/admin/system-logs",
    readOnly: true,
    columns: [
      { key: "action", label: "Action" },
      { key: "user", label: "User" },
      { key: "module", label: "Module" },
      { key: "level", label: "Level" },
      { key: "createdAt", label: "Time" },
    ],
    fields: [],
  },
};

export const HREF_TO_RESOURCE: Record<string, string> = {
  "/admin/users": "users",
  "/admin/instructors": "instructors",
  "/admin/courses": "courses",
  "/admin/categories": "categories",
  "/admin/lessons": "lessons",
  "/admin/assignments": "assignments",
  "/admin/quizzes": "quizzes",
  "/admin/certificates": "certificates",
  "/admin/live-classes": "liveClasses",
  "/admin/payments": "payments",
  "/admin/orders": "orders",
  "/admin/subscriptions": "subscriptions",
  "/admin/coupons": "coupons",
  "/admin/blogs": "blogs",
  "/admin/events": "events",
  "/admin/testimonials": "testimonials",
  "/admin/gallery": "gallery",
  "/admin/cms-pages": "cmsPages",
  "/admin/faq": "faq",
  "/admin/newsletter-subscribers": "newsletterSubscribers",
  "/admin/roles": "roles",
  "/admin/system-logs": "systemLogs",
};

export const API_RESOURCE_MAP: Record<string, CollectionKey> = {
  users: "users",
  instructors: "instructors",
  courses: "courses",
  categories: "categories",
  lessons: "lessons",
  assignments: "assignments",
  quizzes: "quizzes",
  quizAttempts: "quizAttempts",
  "quiz-attempts": "quizAttempts",
  certificates: "certificates",
  "live-classes": "liveClasses",
  payments: "payments",
  orders: "orders",
  subscriptions: "subscriptions",
  coupons: "coupons",
  blogs: "blogs",
  events: "events",
  testimonials: "testimonials",
  gallery: "gallery",
  "cms-pages": "cmsPages",
  faq: "faq",
  roles: "roles",
  "system-logs": "systemLogs",
  activities: "activities",
  "newsletter-subscribers": "newsletterSubscribers",
  "email-outbox": "emailOutbox",
};
