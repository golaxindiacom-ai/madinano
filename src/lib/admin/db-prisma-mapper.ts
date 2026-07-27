import type {
  Activity,
  AdminDatabase,
  AppSettings,
  Assignment,
  AssignmentSubmission,
  Blog,
  Category,
  Certificate,
  CmsPage,
  Coupon,
  Course,
  EmailOutboxItem,
  Enrollment,
  Event,
  FaqItem,
  GalleryItem,
  Instructor,
  Lesson,
  LiveClass,
  NewsletterSubscriber,
  Order,
  Payment,
  Quiz,
  QuizAttempt,
  Role,
  Subscription,
  SystemLog,
  Testimonial,
  User,
} from "./types";
import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import type {
  Activity as PrismaActivity,
  Assignment as PrismaAssignment,
  AssignmentSubmission as PrismaAssignmentSubmission,
  Blog as PrismaBlog,
  Category as PrismaCategory,
  Certificate as PrismaCertificate,
  CmsPage as PrismaCmsPage,
  Coupon as PrismaCoupon,
  Course as PrismaCourse,
  EmailOutboxItem as PrismaEmailOutboxItem,
  Enrollment as PrismaEnrollment,
  Event as PrismaEvent,
  FaqItem as PrismaFaqItem,
  GalleryItem as PrismaGalleryItem,
  Instructor as PrismaInstructor,
  Lesson as PrismaLesson,
  LiveClass as PrismaLiveClass,
  NewsletterSubscriber as PrismaNewsletterSubscriber,
  Order as PrismaOrder,
  Payment as PrismaPayment,
  Quiz as PrismaQuiz,
  QuizAttempt as PrismaQuizAttempt,
  Role as PrismaRole,
  Subscription as PrismaSubscription,
  SystemLog as PrismaSystemLog,
  Testimonial as PrismaTestimonial,
  User as PrismaUser,
} from "@/generated/prisma/client";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

function asInputJson<T>(value: T | null | undefined): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

function toDate(value: string): Date {
  return new Date(value);
}

function toIso(value: Date): string {
  return value.toISOString();
}

function jsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value as T;
}

function mapUser(row: PrismaUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User["role"],
    status: row.status as User["status"],
    phone: row.phone ?? undefined,
    country: row.country ?? undefined,
    city: row.city ?? undefined,
    notes: row.notes ?? undefined,
    instructorId: row.instructorId ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    lastLoginAt: row.lastLoginAt ? toIso(row.lastLoginAt) : undefined,
    passwordHash: row.passwordHash ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapUserToPrisma(row: User) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    phone: row.phone ?? null,
    country: row.country ?? null,
    city: row.city ?? null,
    notes: row.notes ?? null,
    instructorId: row.instructorId ?? null,
    avatarUrl: row.avatarUrl ?? null,
    lastLoginAt: row.lastLoginAt ? toDate(row.lastLoginAt) : null,
    passwordHash: row.passwordHash ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapInstructor(row: PrismaInstructor): Instructor {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    expertise: row.expertise,
    bio: row.bio ?? undefined,
    phone: row.phone ?? undefined,
    country: row.country ?? undefined,
    city: row.city ?? undefined,
    courses: row.courses,
    students: row.students,
    rating: row.rating,
    status: row.status as Instructor["status"],
    userId: row.userId ?? undefined,
    slug: row.slug ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    title: row.title ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapInstructorToPrisma(row: Instructor) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    expertise: row.expertise,
    bio: row.bio ?? null,
    phone: row.phone ?? null,
    country: row.country ?? null,
    city: row.city ?? null,
    courses: row.courses,
    students: row.students,
    rating: row.rating,
    status: row.status,
    userId: row.userId ?? null,
    slug: row.slug ?? null,
    avatarUrl: row.avatarUrl ?? null,
    title: row.title ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapEnrollment(row: PrismaEnrollment): Enrollment {
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    progress: row.progress,
    status: row.status as Enrollment["status"],
    enrolledAt: toIso(row.enrolledAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapEnrollmentToPrisma(row: Enrollment) {
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    progress: row.progress,
    status: row.status,
    enrolledAt: toDate(row.enrolledAt),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapCategory(row: PrismaCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId,
    level: row.level as Category["level"],
    description: row.description ?? undefined,
    order: row.order,
    courseCount: row.courseCount,
    status: row.status as Category["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapCategoryToPrisma(row: Category) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId,
    level: row.level,
    description: row.description ?? null,
    order: row.order,
    courseCount: row.courseCount,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapCourse(row: PrismaCourse): Course {
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.shortDescription ?? undefined,
    description: row.description,
    mainCategoryId: row.mainCategoryId,
    subCategoryId: row.subCategoryId ?? undefined,
    subSubCategoryId: row.subSubCategoryId ?? undefined,
    categoryId: row.categoryId,
    instructorId: row.instructorId,
    originalPrice: row.originalPrice,
    sellingPrice: row.sellingPrice,
    price: row.price ?? undefined,
    enrollments: row.enrollments,
    rating: row.rating,
    status: row.status as Course["status"],
    level: row.level as Course["level"],
    mode: row.mode as Course["mode"],
    duration: row.duration,
    language: row.language ?? undefined,
    requirements: jsonValue(row.requirements, undefined),
    outcomes: jsonValue(row.outcomes, undefined),
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    curriculum: jsonValue(row.curriculum, []),
    finalExamQuizId: row.finalExamQuizId ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapCourseToPrisma(row: Course) {
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.shortDescription ?? null,
    description: row.description,
    mainCategoryId: row.mainCategoryId,
    subCategoryId: row.subCategoryId ?? null,
    subSubCategoryId: row.subSubCategoryId ?? null,
    categoryId: row.categoryId,
    instructorId: row.instructorId,
    originalPrice: row.originalPrice,
    sellingPrice: row.sellingPrice,
    price: row.price ?? null,
    enrollments: row.enrollments,
    rating: row.rating,
    status: row.status,
    level: row.level,
    mode: row.mode,
    duration: row.duration,
    language: row.language ?? null,
    requirements: asInputJson(row.requirements),
    outcomes: asInputJson(row.outcomes),
    thumbnailUrl: row.thumbnailUrl ?? null,
    curriculum: asInputJson(row.curriculum) ?? [],
    finalExamQuizId: row.finalExamQuizId ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapLesson(row: PrismaLesson): Lesson {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId,
    sectionId: row.sectionId,
    description: row.description ?? undefined,
    duration: row.duration,
    order: row.order,
    status: row.status as Lesson["status"],
    lessonType: row.lessonType as Lesson["lessonType"],
    content: row.content ?? undefined,
    videoProvider: (row.videoProvider as Lesson["videoProvider"]) ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    videoId: row.videoId ?? undefined,
    isPrivateVideo: row.isPrivateVideo ?? undefined,
    quizId: row.quizId ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapLessonToPrisma(row: Lesson) {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId,
    sectionId: row.sectionId,
    description: row.description ?? null,
    duration: row.duration,
    order: row.order,
    status: row.status,
    lessonType: row.lessonType,
    content: row.content ?? null,
    videoProvider: row.videoProvider ?? null,
    videoUrl: row.videoUrl ?? null,
    videoId: row.videoId ?? null,
    isPrivateVideo: row.isPrivateVideo ?? null,
    quizId: row.quizId ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapAssignment(row: PrismaAssignment): Assignment {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId,
    sectionId: row.sectionId ?? undefined,
    lessonId: row.lessonId ?? undefined,
    description: row.description ?? undefined,
    instructions: row.instructions ?? undefined,
    dueDate: toIso(row.dueDate),
    maxMarks: row.maxMarks ?? undefined,
    allowLateSubmission: row.allowLateSubmission ?? undefined,
    submissions: row.submissions,
    status: row.status as Assignment["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapAssignmentToPrisma(row: Assignment) {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId,
    sectionId: row.sectionId ?? null,
    lessonId: row.lessonId ?? null,
    description: row.description ?? null,
    instructions: row.instructions ?? null,
    dueDate: toDate(row.dueDate),
    maxMarks: row.maxMarks ?? null,
    allowLateSubmission: row.allowLateSubmission ?? null,
    submissions: row.submissions,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapAssignmentSubmission(row: PrismaAssignmentSubmission): AssignmentSubmission {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    userId: row.userId,
    content: row.content ?? undefined,
    fileUrl: row.fileUrl ?? undefined,
    status: row.status as AssignmentSubmission["status"],
    marks: row.marks ?? undefined,
    feedback: row.feedback ?? undefined,
    submittedAt: toIso(row.submittedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapAssignmentSubmissionToPrisma(row: AssignmentSubmission) {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    userId: row.userId,
    content: row.content ?? null,
    fileUrl: row.fileUrl ?? null,
    status: row.status,
    marks: row.marks ?? null,
    feedback: row.feedback ?? null,
    submittedAt: toDate(row.submittedAt),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapQuiz(row: PrismaQuiz): Quiz {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    courseId: row.courseId ?? undefined,
    courseTitle: row.courseTitle ?? undefined,
    instructorId: row.instructorId ?? undefined,
    quizKind: (row.quizKind as Quiz["quizKind"]) ?? undefined,
    lessonId: row.lessonId ?? undefined,
    instructions: row.instructions ?? undefined,
    durationMinutes: row.durationMinutes,
    totalMarks: row.totalMarks,
    passingMarks: row.passingMarks,
    passingPercentage: row.passingPercentage,
    maxAttempts: row.maxAttempts,
    shuffleQuestions: row.shuffleQuestions,
    shuffleOptions: row.shuffleOptions,
    showResultsInstantly: row.showResultsInstantly,
    issueCertificateOnPass: row.issueCertificateOnPass,
    certificateTemplate: (row.certificateTemplate as Quiz["certificateTemplate"]) ?? undefined,
    enableProctoring: row.enableProctoring,
    maxProctorViolations: row.maxProctorViolations,
    autoSubmitOnProctorViolation: row.autoSubmitOnProctorViolation,
    requireFullscreen: row.requireFullscreen,
    questionItems: jsonValue(row.questionItems, []),
    questions: row.questions,
    attempts: row.attempts,
    status: row.status as Quiz["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapQuizToPrisma(row: Quiz) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    courseId: row.courseId ?? null,
    courseTitle: row.courseTitle ?? null,
    instructorId: row.instructorId ?? null,
    quizKind: row.quizKind ?? null,
    lessonId: row.lessonId ?? null,
    instructions: row.instructions ?? null,
    durationMinutes: row.durationMinutes,
    totalMarks: row.totalMarks,
    passingMarks: row.passingMarks,
    passingPercentage: row.passingPercentage,
    maxAttempts: row.maxAttempts,
    shuffleQuestions: row.shuffleQuestions,
    shuffleOptions: row.shuffleOptions,
    showResultsInstantly: row.showResultsInstantly,
    issueCertificateOnPass: row.issueCertificateOnPass,
    certificateTemplate: row.certificateTemplate ?? null,
    enableProctoring: row.enableProctoring,
    maxProctorViolations: row.maxProctorViolations,
    autoSubmitOnProctorViolation: row.autoSubmitOnProctorViolation,
    requireFullscreen: row.requireFullscreen,
    questionItems: asInputJson(row.questionItems) ?? [],
    questions: row.questions,
    attempts: row.attempts,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapQuizAttempt(row: PrismaQuizAttempt): QuizAttempt {
  return {
    id: row.id,
    quizId: row.quizId,
    quizTitle: row.quizTitle,
    studentId: row.studentId,
    studentName: row.studentName,
    studentEmail: row.studentEmail,
    startedAt: toIso(row.startedAt),
    submittedAt: row.submittedAt ? toIso(row.submittedAt) : undefined,
    answers: jsonValue(row.answers, {}),
    score: row.score,
    totalMarks: row.totalMarks,
    percentage: row.percentage,
    passed: row.passed,
    timeTakenSeconds: row.timeTakenSeconds,
    status: row.status as QuizAttempt["status"],
    certificateId: row.certificateId ?? undefined,
    tabSwitchCount: row.tabSwitchCount ?? undefined,
    proctoringViolations: jsonValue(row.proctoringViolations, undefined),
    autoSubmittedByProctor: row.autoSubmittedByProctor ?? undefined,
    questionResults: jsonValue(row.questionResults, undefined),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapQuizAttemptToPrisma(row: QuizAttempt) {
  return {
    id: row.id,
    quizId: row.quizId,
    quizTitle: row.quizTitle,
    studentId: row.studentId,
    studentName: row.studentName,
    studentEmail: row.studentEmail,
    startedAt: toDate(row.startedAt),
    submittedAt: row.submittedAt ? toDate(row.submittedAt) : null,
    answers: asInputJson(row.answers) ?? {},
    score: row.score,
    totalMarks: row.totalMarks,
    percentage: row.percentage,
    passed: row.passed,
    timeTakenSeconds: row.timeTakenSeconds,
    status: row.status,
    certificateId: row.certificateId ?? null,
    tabSwitchCount: row.tabSwitchCount ?? null,
    proctoringViolations: asInputJson(row.proctoringViolations),
    autoSubmittedByProctor: row.autoSubmittedByProctor ?? null,
    questionResults: asInputJson(row.questionResults),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapCertificate(row: PrismaCertificate): Certificate {
  return {
    id: row.id,
    certificateNo: row.certificateNo,
    studentId: row.studentId,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? undefined,
    courseTitle: row.courseTitle,
    quizTitle: row.quizTitle,
    quizId: row.quizId,
    attemptId: row.attemptId,
    score: row.score,
    percentage: row.percentage,
    issuedAt: toIso(row.issuedAt),
    verifyUrl: row.verifyUrl,
    qrCodeDataUrl: row.qrCodeDataUrl ?? undefined,
    template: (row.template as Certificate["template"]) ?? undefined,
    status: row.status as Certificate["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapCertificateToPrisma(row: Certificate) {
  return {
    id: row.id,
    certificateNo: row.certificateNo,
    studentId: row.studentId,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? null,
    courseTitle: row.courseTitle,
    quizTitle: row.quizTitle,
    quizId: row.quizId,
    attemptId: row.attemptId,
    score: row.score,
    percentage: row.percentage,
    issuedAt: toDate(row.issuedAt),
    verifyUrl: row.verifyUrl,
    qrCodeDataUrl: row.qrCodeDataUrl ?? null,
    template: row.template ?? null,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapLiveClass(row: PrismaLiveClass): LiveClass {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId ?? undefined,
    sectionId: row.sectionId ?? undefined,
    instructorName: row.instructorName,
    description: row.description ?? undefined,
    scheduledAt: toIso(row.scheduledAt),
    duration: row.duration,
    enrolled: row.enrolled,
    status: row.status as LiveClass["status"],
    platform: row.platform as LiveClass["platform"],
    meetingUrl: row.meetingUrl ?? undefined,
    meetingId: row.meetingId ?? undefined,
    passcode: row.passcode ?? undefined,
    youtubeLiveUrl: row.youtubeLiveUrl ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapLiveClassToPrisma(row: LiveClass) {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId ?? null,
    sectionId: row.sectionId ?? null,
    instructorName: row.instructorName,
    description: row.description ?? null,
    scheduledAt: toDate(row.scheduledAt),
    duration: row.duration,
    enrolled: row.enrolled,
    status: row.status,
    platform: row.platform,
    meetingUrl: row.meetingUrl ?? null,
    meetingId: row.meetingId ?? null,
    passcode: row.passcode ?? null,
    youtubeLiveUrl: row.youtubeLiveUrl ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapPayment(row: PrismaPayment): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    orderNo: row.orderNo ?? undefined,
    userId: row.userId ?? undefined,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? undefined,
    courseId: row.courseId ?? undefined,
    courseTitle: row.courseTitle ?? undefined,
    amount: row.amount,
    method: row.method as Payment["method"],
    status: row.status as Payment["status"],
    transactionId: row.transactionId ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapPaymentToPrisma(row: Payment) {
  return {
    id: row.id,
    orderId: row.orderId,
    orderNo: row.orderNo ?? null,
    userId: row.userId ?? null,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? null,
    courseId: row.courseId ?? null,
    courseTitle: row.courseTitle ?? null,
    amount: row.amount,
    method: row.method,
    status: row.status,
    transactionId: row.transactionId ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapOrder(row: PrismaOrder): Order {
  return {
    id: row.id,
    orderNo: row.orderNo,
    userId: row.userId ?? undefined,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? undefined,
    courseId: row.courseId ?? undefined,
    courseTitle: row.courseTitle,
    amount: row.amount,
    discount: row.discount ?? undefined,
    couponCode: row.couponCode ?? undefined,
    status: row.status as Order["status"],
    paymentId: row.paymentId ?? undefined,
    billingAddress: jsonValue(row.billingAddress, undefined),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapOrderToPrisma(row: Order) {
  return {
    id: row.id,
    orderNo: row.orderNo,
    userId: row.userId ?? null,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? null,
    courseId: row.courseId ?? null,
    courseTitle: row.courseTitle,
    amount: row.amount,
    discount: row.discount ?? null,
    couponCode: row.couponCode ?? null,
    status: row.status,
    paymentId: row.paymentId ?? null,
    billingAddress: asInputJson(row.billingAddress),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapSubscription(row: PrismaSubscription): Subscription {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? undefined,
    plan: row.plan as Subscription["plan"],
    amount: row.amount,
    startDate: toIso(row.startDate),
    endDate: toIso(row.endDate),
    status: row.status as Subscription["status"],
    autoRenew: row.autoRenew ?? undefined,
    paymentMethod: (row.paymentMethod as Subscription["paymentMethod"]) ?? undefined,
    transactionId: row.transactionId ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapSubscriptionToPrisma(row: Subscription) {
  return {
    id: row.id,
    userId: row.userId ?? null,
    studentName: row.studentName,
    studentEmail: row.studentEmail ?? null,
    plan: row.plan,
    amount: row.amount,
    startDate: toDate(row.startDate),
    endDate: toDate(row.endDate),
    status: row.status,
    autoRenew: row.autoRenew ?? null,
    paymentMethod: row.paymentMethod ?? null,
    transactionId: row.transactionId ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapCoupon(row: PrismaCoupon): Coupon {
  return {
    id: row.id,
    code: row.code,
    discount: row.discount,
    discountType: row.discountType as Coupon["discountType"],
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    expiresAt: toIso(row.expiresAt),
    status: row.status as Coupon["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapCouponToPrisma(row: Coupon) {
  return {
    id: row.id,
    code: row.code,
    discount: row.discount,
    discountType: row.discountType,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    expiresAt: toDate(row.expiresAt),
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapBlog(row: PrismaBlog): Blog {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug ?? undefined,
    category: row.category,
    author: row.author,
    excerpt: row.excerpt ?? undefined,
    content: row.content ?? undefined,
    coverImage: row.coverImage ?? undefined,
    readTime: row.readTime ?? undefined,
    status: row.status as Blog["status"],
    publishedAt: row.publishedAt ? toIso(row.publishedAt) : undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapBlogToPrisma(row: Blog) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug ?? null,
    category: row.category,
    author: row.author,
    excerpt: row.excerpt ?? null,
    content: row.content ?? null,
    coverImage: row.coverImage ?? null,
    readTime: row.readTime ?? null,
    status: row.status,
    publishedAt: row.publishedAt ? toDate(row.publishedAt) : null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapEvent(row: PrismaEvent): Event {
  return {
    id: row.id,
    title: row.title,
    date: toIso(row.date),
    location: row.location,
    attendees: row.attendees,
    status: row.status as Event["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapEventToPrisma(row: Event) {
  return {
    id: row.id,
    title: row.title,
    date: toDate(row.date),
    location: row.location,
    attendees: row.attendees,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapTestimonial(row: PrismaTestimonial): Testimonial {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    quote: row.quote,
    rating: row.rating,
    avatarUrl: row.avatarUrl ?? undefined,
    status: row.status as Testimonial["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapTestimonialToPrisma(row: Testimonial) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    quote: row.quote,
    rating: row.rating,
    avatarUrl: row.avatarUrl ?? null,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapGalleryItem(row: PrismaGalleryItem): GalleryItem {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.imageUrl,
    category: row.category,
    status: row.status as GalleryItem["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapGalleryItemToPrisma(row: GalleryItem) {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.imageUrl,
    category: row.category,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapCmsPage(row: PrismaCmsPage): CmsPage {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status as CmsPage["status"],
    content: row.content,
    excerpt: row.excerpt ?? undefined,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapCmsPageToPrisma(row: CmsPage) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    content: row.content,
    excerpt: row.excerpt ?? null,
    seoTitle: row.seoTitle ?? null,
    seoDescription: row.seoDescription ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapFaqItem(row: PrismaFaqItem): FaqItem {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    status: row.status as FaqItem["status"],
    order: row.order,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapFaqItemToPrisma(row: FaqItem) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    status: row.status,
    order: row.order,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapRole(row: PrismaRole): Role {
  return {
    id: row.id,
    name: row.name,
    permissions: jsonValue(row.permissions, []),
    userCount: row.userCount,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapRoleToPrisma(row: Role) {
  return {
    id: row.id,
    name: row.name,
    permissions: asInputJson(row.permissions) ?? [],
    userCount: row.userCount,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapSystemLog(row: PrismaSystemLog): SystemLog {
  return {
    id: row.id,
    action: row.action,
    user: row.user,
    module: row.module,
    ip: row.ip,
    level: row.level as SystemLog["level"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapSystemLogToPrisma(row: SystemLog) {
  return {
    id: row.id,
    action: row.action,
    user: row.user,
    module: row.module,
    ip: row.ip,
    level: row.level,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapActivity(row: PrismaActivity): Activity {
  return {
    id: row.id,
    message: row.message,
    type: row.type,
    color: row.color,
    userId: row.userId ?? undefined,
    audience: (row.audience as Activity["audience"]) ?? undefined,
    readBy: jsonValue(row.readBy, undefined),
    href: row.href ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapActivityToPrisma(row: Activity) {
  return {
    id: row.id,
    message: row.message,
    type: row.type,
    color: row.color,
    userId: row.userId ?? null,
    audience: row.audience ?? null,
    readBy: asInputJson(row.readBy),
    href: row.href ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapNewsletterSubscriber(row: PrismaNewsletterSubscriber): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    status: row.status as NewsletterSubscriber["status"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapNewsletterSubscriberToPrisma(row: NewsletterSubscriber) {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapEmailOutboxItem(row: PrismaEmailOutboxItem): EmailOutboxItem {
  return {
    id: row.id,
    to: row.to,
    subject: row.subject,
    body: row.body,
    status: row.status as EmailOutboxItem["status"],
    relatedType: row.relatedType ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapEmailOutboxItemToPrisma(row: EmailOutboxItem) {
  return {
    id: row.id,
    to: row.to,
    subject: row.subject,
    body: row.body,
    status: row.status,
    relatedType: row.relatedType ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

type PrismaRows = {
  users: PrismaUser[];
  instructors: PrismaInstructor[];
  enrollments: PrismaEnrollment[];
  categories: PrismaCategory[];
  courses: PrismaCourse[];
  lessons: PrismaLesson[];
  assignments: PrismaAssignment[];
  assignmentSubmissions: PrismaAssignmentSubmission[];
  quizzes: PrismaQuiz[];
  quizAttempts: PrismaQuizAttempt[];
  certificates: PrismaCertificate[];
  liveClasses: PrismaLiveClass[];
  payments: PrismaPayment[];
  orders: PrismaOrder[];
  subscriptions: PrismaSubscription[];
  coupons: PrismaCoupon[];
  blogs: PrismaBlog[];
  events: PrismaEvent[];
  testimonials: PrismaTestimonial[];
  gallery: PrismaGalleryItem[];
  cmsPages: PrismaCmsPage[];
  faq: PrismaFaqItem[];
  roles: PrismaRole[];
  systemLogs: PrismaSystemLog[];
  activities: PrismaActivity[];
  newsletterSubscribers: PrismaNewsletterSubscriber[];
  emailOutbox: PrismaEmailOutboxItem[];
  settings: AppSettings;
};

export function prismaRowsToAdminDatabase(rows: PrismaRows): AdminDatabase {
  return {
    users: rows.users.map(mapUser),
    instructors: rows.instructors.map(mapInstructor),
    enrollments: rows.enrollments.map(mapEnrollment),
    categories: rows.categories.map(mapCategory),
    courses: rows.courses.map(mapCourse),
    lessons: rows.lessons.map(mapLesson),
    assignments: rows.assignments.map(mapAssignment),
    assignmentSubmissions: rows.assignmentSubmissions.map(mapAssignmentSubmission),
    quizzes: rows.quizzes.map(mapQuiz),
    quizAttempts: rows.quizAttempts.map(mapQuizAttempt),
    certificates: rows.certificates.map(mapCertificate),
    liveClasses: rows.liveClasses.map(mapLiveClass),
    payments: rows.payments.map(mapPayment),
    orders: rows.orders.map(mapOrder),
    subscriptions: rows.subscriptions.map(mapSubscription),
    coupons: rows.coupons.map(mapCoupon),
    blogs: rows.blogs.map(mapBlog),
    events: rows.events.map(mapEvent),
    testimonials: rows.testimonials.map(mapTestimonial),
    gallery: rows.gallery.map(mapGalleryItem),
    cmsPages: rows.cmsPages.map(mapCmsPage),
    faq: rows.faq.map(mapFaqItem),
    roles: rows.roles.map(mapRole),
    systemLogs: rows.systemLogs.map(mapSystemLog),
    activities: rows.activities.map(mapActivity),
    newsletterSubscribers: rows.newsletterSubscribers.map(mapNewsletterSubscriber),
    emailOutbox: rows.emailOutbox.map(mapEmailOutboxItem),
    settings: rows.settings,
  };
}

async function createManyIfNotEmpty<T>(
  items: T[],
  create: (data: T[]) => Promise<unknown>,
): Promise<void> {
  if (items.length > 0) await create(items);
}

export async function syncAdminDatabaseToPrisma(db: AdminDatabase, tx: TransactionClient): Promise<void> {
  await tx.user.deleteMany();
  await tx.instructor.deleteMany();
  await tx.enrollment.deleteMany();
  await tx.category.deleteMany();
  await tx.course.deleteMany();
  await tx.lesson.deleteMany();
  await tx.assignment.deleteMany();
  await tx.assignmentSubmission.deleteMany();
  await tx.quiz.deleteMany();
  await tx.quizAttempt.deleteMany();
  await tx.certificate.deleteMany();
  await tx.liveClass.deleteMany();
  await tx.payment.deleteMany();
  await tx.order.deleteMany();
  await tx.subscription.deleteMany();
  await tx.coupon.deleteMany();
  await tx.blog.deleteMany();
  await tx.event.deleteMany();
  await tx.testimonial.deleteMany();
  await tx.galleryItem.deleteMany();
  await tx.cmsPage.deleteMany();
  await tx.faqItem.deleteMany();
  await tx.role.deleteMany();
  await tx.systemLog.deleteMany();
  await tx.activity.deleteMany();
  await tx.newsletterSubscriber.deleteMany();
  await tx.emailOutboxItem.deleteMany();

  await createManyIfNotEmpty(db.users.map(mapUserToPrisma), (data) => tx.user.createMany({ data }));
  await createManyIfNotEmpty(db.instructors.map(mapInstructorToPrisma), (data) => tx.instructor.createMany({ data }));
  await createManyIfNotEmpty(db.enrollments.map(mapEnrollmentToPrisma), (data) => tx.enrollment.createMany({ data }));
  await createManyIfNotEmpty(db.categories.map(mapCategoryToPrisma), (data) => tx.category.createMany({ data }));
  await createManyIfNotEmpty(db.courses.map(mapCourseToPrisma), (data) => tx.course.createMany({ data }));
  await createManyIfNotEmpty(db.lessons.map(mapLessonToPrisma), (data) => tx.lesson.createMany({ data }));
  await createManyIfNotEmpty(db.assignments.map(mapAssignmentToPrisma), (data) => tx.assignment.createMany({ data }));
  await createManyIfNotEmpty(db.assignmentSubmissions.map(mapAssignmentSubmissionToPrisma), (data) =>
    tx.assignmentSubmission.createMany({ data }),
  );
  await createManyIfNotEmpty(db.quizzes.map(mapQuizToPrisma), (data) => tx.quiz.createMany({ data }));
  await createManyIfNotEmpty(db.quizAttempts.map(mapQuizAttemptToPrisma), (data) => tx.quizAttempt.createMany({ data }));
  await createManyIfNotEmpty(db.certificates.map(mapCertificateToPrisma), (data) => tx.certificate.createMany({ data }));
  await createManyIfNotEmpty(db.liveClasses.map(mapLiveClassToPrisma), (data) => tx.liveClass.createMany({ data }));
  await createManyIfNotEmpty(db.payments.map(mapPaymentToPrisma), (data) => tx.payment.createMany({ data }));
  await createManyIfNotEmpty(db.orders.map(mapOrderToPrisma), (data) => tx.order.createMany({ data }));
  await createManyIfNotEmpty(db.subscriptions.map(mapSubscriptionToPrisma), (data) => tx.subscription.createMany({ data }));
  await createManyIfNotEmpty(db.coupons.map(mapCouponToPrisma), (data) => tx.coupon.createMany({ data }));
  await createManyIfNotEmpty(db.blogs.map(mapBlogToPrisma), (data) => tx.blog.createMany({ data }));
  await createManyIfNotEmpty(db.events.map(mapEventToPrisma), (data) => tx.event.createMany({ data }));
  await createManyIfNotEmpty(db.testimonials.map(mapTestimonialToPrisma), (data) => tx.testimonial.createMany({ data }));
  await createManyIfNotEmpty(db.gallery.map(mapGalleryItemToPrisma), (data) => tx.galleryItem.createMany({ data }));
  await createManyIfNotEmpty(db.cmsPages.map(mapCmsPageToPrisma), (data) => tx.cmsPage.createMany({ data }));
  await createManyIfNotEmpty(db.faq.map(mapFaqItemToPrisma), (data) => tx.faqItem.createMany({ data }));
  await createManyIfNotEmpty(db.roles.map(mapRoleToPrisma), (data) => tx.role.createMany({ data }));
  await createManyIfNotEmpty(db.systemLogs.map(mapSystemLogToPrisma), (data) => tx.systemLog.createMany({ data }));
  await createManyIfNotEmpty(db.activities.map(mapActivityToPrisma), (data) => tx.activity.createMany({ data }));
  await createManyIfNotEmpty(db.newsletterSubscribers.map(mapNewsletterSubscriberToPrisma), (data) =>
    tx.newsletterSubscriber.createMany({ data }),
  );
  await createManyIfNotEmpty(db.emailOutbox.map(mapEmailOutboxItemToPrisma), (data) =>
    tx.emailOutboxItem.createMany({ data }),
  );

  await tx.appSetting.upsert({
    where: { id: "default" },
    create: { id: "default", settings: asInputJson(db.settings)! },
    update: { settings: asInputJson(db.settings)! },
  });
}
