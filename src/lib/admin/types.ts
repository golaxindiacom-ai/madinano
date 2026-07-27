export type BaseEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type User = BaseEntity & {
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  status: "active" | "inactive" | "suspended";
  phone?: string;
  country?: string;
  city?: string;
  notes?: string;
  instructorId?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  passwordHash?: string;
};

export type Enrollment = BaseEntity & {
  userId: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  status: "active" | "completed" | "dropped";
  enrolledAt: string;
};

export type UserInput = {
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
  phone?: string;
  country?: string;
  city?: string;
  notes?: string;
};

export type UserStats = {
  total: number;
  students: number;
  instructors: number;
  admins: number;
  active: number;
  suspended: number;
};

export type UserDetailPayload = {
  user: User;
  enrollments: Enrollment[];
  certificates: Certificate[];
  attempts: QuizAttempt[];
  orders: Order[];
};

export type Instructor = BaseEntity & {
  name: string;
  email: string;
  expertise: string;
  bio?: string;
  phone?: string;
  country?: string;
  city?: string;
  courses: number;
  students: number;
  rating: number;
  status: "active" | "pending" | "inactive";
  userId?: string;
  slug?: string;
  avatarUrl?: string;
  title?: string;
};

export type InstructorInput = {
  name: string;
  email: string;
  expertise: string;
  bio?: string;
  phone?: string;
  country?: string;
  rating?: number;
  status: Instructor["status"];
};

export type InstructorStats = {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  totalCourses: number;
  totalStudents: number;
};

export type InstructorDetailPayload = {
  instructor: Instructor;
  user: User | null;
  courses: Course[];
  quizzes: Quiz[];
  uniqueStudents: number;
};

export type CourseMode = "recorded" | "live" | "hybrid";

export type CurriculumSection = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export type LessonType = "video" | "text" | "quiz" | "assignment";
export type VideoProvider = "youtube" | "vimeo" | "upload";

export type LiveClassPlatform = "youtube" | "google_meet" | "zoom";

export type CategoryLevel = 1 | 2 | 3;

export type Category = BaseEntity & {
  name: string;
  slug: string;
  parentId: string | null;
  level: CategoryLevel;
  description?: string;
  order: number;
  courseCount: number;
  status: "active" | "inactive";
};

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  status: Category["status"];
  order?: number;
  level: CategoryLevel;
  parentId?: string | null;
};

export type CategoryStats = {
  total: number;
  active: number;
  inactive: number;
  level1: number;
  level2: number;
  level3: number;
  totalCourses: number;
};

export type CategoryDetailPayload = {
  category: Category;
  breadcrumb: string;
  children: Category[];
  courses: Course[];
  childCount: number;
};

export type Course = BaseEntity & {
  title: string;
  shortDescription?: string;
  description: string;
  mainCategoryId: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  categoryId: string;
  instructorId: string;
  originalPrice: number;
  sellingPrice: number;
  /** @deprecated use sellingPrice */
  price?: number;
  enrollments: number;
  rating: number;
  status: "published" | "draft" | "archived";
  level: "beginner" | "intermediate" | "advanced";
  mode: CourseMode;
  duration: string;
  language?: string;
  requirements?: string[];
  outcomes?: string[];
  thumbnailUrl?: string;
  curriculum: CurriculumSection[];
  finalExamQuizId?: string;
};

export type Lesson = BaseEntity & {
  title: string;
  courseId: string;
  sectionId: string;
  description?: string;
  duration: string;
  order: number;
  status: "published" | "draft";
  lessonType: LessonType;
  content?: string;
  videoProvider?: VideoProvider;
  videoUrl?: string;
  videoId?: string;
  isPrivateVideo?: boolean;
  quizId?: string;
};

export type LessonInput = {
  title: string;
  courseId: string;
  sectionId: string;
  description?: string;
  duration: string;
  order?: number;
  status: Lesson["status"];
  lessonType: LessonType;
  content?: string;
  videoUrl?: string;
  isPrivateVideo?: boolean;
  quizId?: string;
};

export type LessonListItem = Lesson & {
  courseTitle: string;
  sectionTitle: string;
  quizTitle?: string;
  instructorName: string;
};

export type LessonStats = {
  total: number;
  published: number;
  draft: number;
  video: number;
  text: number;
  quiz: number;
  assignment: number;
  coursesWithLessons: number;
};

export type LessonDetailPayload = {
  lesson: Lesson;
  courseTitle: string;
  sectionTitle: string;
  instructorName: string;
  quiz: Quiz | null;
};

export type LiveClass = BaseEntity & {
  title: string;
  courseId?: string;
  sectionId?: string;
  instructorName: string;
  description?: string;
  scheduledAt: string;
  duration: string;
  enrolled: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  platform: LiveClassPlatform;
  meetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  youtubeLiveUrl?: string;
};

export type LiveClassInput = {
  title: string;
  courseId?: string;
  sectionId?: string;
  instructorName?: string;
  description?: string;
  scheduledAt: string;
  duration: string;
  platform: LiveClassPlatform;
  meetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  youtubeLiveUrl?: string;
  status: LiveClass["status"];
};

export type LiveClassListItem = LiveClass & {
  courseTitle?: string;
  sectionTitle?: string;
  platformLabel: string;
  joinUrl?: string;
  isUpcoming: boolean;
  isPast: boolean;
};

export type LiveClassStats = {
  total: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  totalEnrolled: number;
  coursesWithLiveClasses: number;
};

export type LiveClassDetailPayload = {
  liveClass: LiveClassListItem;
  courseTitle?: string;
  sectionTitle?: string;
};

export type PublicLiveClassItem = {
  id: string;
  title: string;
  instructorName: string;
  description?: string;
  courseTitle?: string;
  scheduledAt: string;
  duration: string;
  enrolled: number;
  status: LiveClass["status"];
  platform: LiveClassPlatform;
  platformLabel: string;
  joinUrl?: string;
};

export type Assignment = BaseEntity & {
  title: string;
  courseId: string;
  sectionId?: string;
  lessonId?: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxMarks?: number;
  allowLateSubmission?: boolean;
  submissions: number;
  status: "open" | "closed";
};

export type AssignmentSubmission = BaseEntity & {
  assignmentId: string;
  userId: string;
  content?: string;
  fileUrl?: string;
  status: "submitted" | "graded" | "returned";
  marks?: number;
  feedback?: string;
  submittedAt: string;
};

export type AssignmentInput = {
  title: string;
  courseId: string;
  sectionId?: string;
  lessonId?: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxMarks?: number;
  allowLateSubmission?: boolean;
  status: Assignment["status"];
};

export type AssignmentListItem = Assignment & {
  courseTitle: string;
  sectionTitle?: string;
  instructorName: string;
  isOverdue: boolean;
  pendingGrading: number;
};

export type AssignmentStats = {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  totalSubmissions: number;
  pendingGrading: number;
  coursesWithAssignments: number;
};

export type AssignmentDetailPayload = {
  assignment: Assignment;
  courseTitle: string;
  sectionTitle?: string;
  instructorName: string;
  lessonTitle?: string;
  isOverdue: boolean;
  submissions: (AssignmentSubmission & { userName: string; userEmail: string })[];
};

export type GradeSubmissionInput = {
  marks: number;
  feedback?: string;
  status?: "graded" | "returned";
};

export type ProctoringViolationType = "tab_switch" | "window_blur" | "fullscreen_exit";

export type ProctoringViolation = {
  type: ProctoringViolationType;
  at: string;
  detail?: string;
};

export type QuestionType = "mcq" | "true_false" | "multi_select";

export type ExamQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  options: { id: string; text: string }[];
  correctOptionIds: string[];
  marks: number;
  negativeMarks?: number;
  order: number;
  explanation?: string;
};

export type QuizKind = "lesson_quiz" | "final_exam";

export type CertificateTemplateId =
  | "classic-maroon"
  | "royal-gold"
  | "modern-minimal"
  | "elegant-forest"
  | "premium-dark";

export type Quiz = BaseEntity & {
  title: string;
  description?: string;
  courseId?: string;
  courseTitle?: string;
  instructorId?: string;
  quizKind?: QuizKind;
  lessonId?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  passingPercentage: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsInstantly: boolean;
  issueCertificateOnPass: boolean;
  certificateTemplate?: CertificateTemplateId;
  enableProctoring: boolean;
  maxProctorViolations: number;
  autoSubmitOnProctorViolation: boolean;
  requireFullscreen: boolean;
  questionItems: ExamQuestion[];
  questions: number;
  attempts: number;
  status: "active" | "inactive" | "draft";
};

export type QuizListItem = Quiz & {
  instructorName?: string;
  lessonTitle?: string;
  isLinked: boolean;
  attemptCount: number;
};

export type QuizStats = {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  lessonQuizzes: number;
  finalExams: number;
  library: number;
  totalAttempts: number;
};

export type QuizAdminDetail = {
  quiz: Quiz;
  instructorName?: string;
  lessonTitle?: string;
  courseTitle?: string;
  attempts: QuizAttempt[];
  links: { type: "lesson" | "final_exam" | "course"; label: string; href: string }[];
};

export type QuizAttempt = BaseEntity & {
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, string[]>;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  status: "in_progress" | "submitted" | "timed_out";
  certificateId?: string;
  tabSwitchCount?: number;
  proctoringViolations?: ProctoringViolation[];
  autoSubmittedByProctor?: boolean;
  questionResults?: {
    questionId: string;
    correct: boolean;
    marksAwarded: number;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    explanation?: string;
  }[];
};

export type QuizAttemptListItem = QuizAttempt & {
  courseTitle?: string;
  quizKind?: QuizKind;
  hasCertificate: boolean;
  violationCount: number;
};

export type QuizAttemptStats = {
  total: number;
  inProgress: number;
  submitted: number;
  timedOut: number;
  passed: number;
  failed: number;
  withViolations: number;
  certificatesIssued: number;
};

export type QuizAttemptDetailPayload = {
  attempt: QuizAttemptListItem;
  quiz?: {
    id: string;
    title: string;
    passingPercentage: number;
    durationMinutes: number;
    quizKind?: QuizKind;
    courseTitle?: string;
    questionItems: ExamQuestion[];
  };
  certificate?: Certificate;
};

export type Certificate = BaseEntity & {
  certificateNo: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  courseTitle: string;
  quizTitle: string;
  quizId: string;
  attemptId: string;
  score: number;
  percentage: number;
  issuedAt: string;
  verifyUrl: string;
  qrCodeDataUrl?: string;
  template?: CertificateTemplateId;
  status: "issued" | "revoked";
};

export type CertificateListItem = Certificate & {
  templateLabel: string;
  isValid: boolean;
};

export type CertificateStats = {
  total: number;
  issued: number;
  revoked: number;
  thisMonth: number;
  uniqueStudents: number;
  averageScore: number;
};

export type CertificateDetailPayload = {
  certificate: CertificateListItem;
  attempt?: {
    id: string;
    percentage: number;
    passed: boolean;
    submittedAt?: string;
  };
  verifyPath: string;
};

export type Payment = BaseEntity & {
  orderId: string;
  orderNo?: string;
  userId?: string;
  studentName: string;
  studentEmail?: string;
  courseId?: string;
  courseTitle?: string;
  amount: number;
  method: "card" | "upi" | "paypal" | "bank";
  status: "completed" | "pending" | "failed" | "refunded";
  transactionId?: string;
};

export type BillingAddress = {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type Order = BaseEntity & {
  orderNo: string;
  userId?: string;
  studentName: string;
  studentEmail?: string;
  courseId?: string;
  courseTitle: string;
  amount: number;
  discount?: number;
  couponCode?: string;
  status: "completed" | "pending" | "cancelled" | "refunded";
  paymentId?: string;
  billingAddress?: BillingAddress;
};

export type PaymentInput = {
  orderId: string;
  studentName: string;
  studentEmail?: string;
  amount: number;
  method: Payment["method"];
  status: Payment["status"];
  transactionId?: string;
};

export type OrderInput = {
  userId?: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  amount: number;
  discount?: number;
  couponCode?: string;
  status: Order["status"];
};

export type PaymentListItem = Payment & {
  orderNo: string;
  courseTitle?: string;
  methodLabel: string;
};

export type OrderListItem = Order & {
  paymentStatus?: Payment["status"];
  paymentMethod?: Payment["method"];
  methodLabel?: string;
  hasPayment: boolean;
  isEnrolled: boolean;
  enrollmentId?: string;
};

export type OrderStats = {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  refunded: number;
  totalValue: number;
  averageOrderValue: number;
  awaitingPayment: number;
  awaitingEnrollment: number;
};

export type FulfillOrderInput = {
  method?: Payment["method"];
  enroll?: boolean;
};

export type OrderDetailPayload = {
  order: OrderListItem;
  payment?: PaymentListItem;
  enrollment?: {
    id: string;
    progress: number;
    status: string;
    enrolledAt: string;
  };
};

export type StudentOrderHistoryItem = {
  id: string;
  orderNo: string;
  courseTitle: string;
  amount: number;
  discount?: number;
  couponCode?: string;
  status: Order["status"];
  hasPayment: boolean;
  isEnrolled: boolean;
  createdAt: string;
};

export type PaymentStats = {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  totalRevenue: number;
  todayRevenue: number;
  thisMonthRevenue: number;
};

export type PaymentDetailPayload = {
  payment: PaymentListItem;
  order?: OrderListItem;
};

export type CheckoutInput = {
  courseId: string;
  userId: string;
  method: Payment["method"];
  couponCode?: string;
  billingAddress: BillingAddress;
};

export type CartCheckoutInput = {
  courseIds: string[];
  userId: string;
  method: Payment["method"];
  couponCode?: string;
  billingAddress: BillingAddress;
};

export type PublicCoupon = {
  code: string;
  discount: number;
  discountType: "percent" | "fixed";
  expiresAt: string;
  description: string;
};

export type CheckoutPageData = CheckoutCourseInfo & {
  availableCoupons: PublicCoupon[];
};

export type CartItem = CheckoutCourseInfo & {
  inCart: boolean;
};

export type CartCheckoutResult = {
  results: CheckoutResult[];
  totalPaid: number;
  message: string;
};

export type CheckoutResult = {
  order: Order;
  payment: Payment;
  enrolled: boolean;
  message: string;
  /** Present when a live gateway must collect payment before enrollment */
  gateway?: {
    provider: "razorpay" | "cashfree" | "demo";
    keyId?: string;
    orderId?: string;
    paymentSessionId?: string;
    amount: number;
    currency: string;
    paymentId: string;
    orderNo: string;
    studentName: string;
    studentEmail: string;
  };
};

export type CheckoutCourseInfo = {
  id: string;
  title: string;
  instructorName: string;
  sellingPrice: number;
  originalPrice: number;
  thumbnailUrl?: string;
  duration: string;
  level: string;
};

export type StudentPaymentHistoryItem = {
  id: string;
  orderNo: string;
  courseTitle: string;
  amount: number;
  method: Payment["method"];
  methodLabel: string;
  status: Payment["status"];
  transactionId?: string;
  createdAt: string;
};

export type Subscription = BaseEntity & {
  userId?: string;
  studentName: string;
  studentEmail?: string;
  plan: "monthly" | "yearly" | "lifetime";
  amount: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  autoRenew?: boolean;
  paymentMethod?: Payment["method"];
  transactionId?: string;
};

export type SubscriptionInput = {
  userId?: string;
  studentName: string;
  studentEmail?: string;
  plan: Subscription["plan"];
  amount?: number;
  startDate: string;
  endDate?: string;
  status: Subscription["status"];
  autoRenew?: boolean;
  paymentMethod?: Payment["method"];
};

export type SubscriptionListItem = Subscription & {
  planLabel: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isCurrentlyActive: boolean;
};

export type SubscriptionStats = {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  expiringSoon: number;
  monthly: number;
  yearly: number;
  lifetime: number;
  mrr: number;
  totalRevenue: number;
};

export type SubscriptionDetailPayload = {
  subscription: SubscriptionListItem;
};

export type SubscriptionPlanInfo = {
  id: Subscription["plan"];
  label: string;
  amount: number;
  period: string;
  savings?: string;
  features: string[];
  popular?: boolean;
};

export type SubscribeInput = {
  userId: string;
  plan: Subscription["plan"];
  method: Payment["method"];
  autoRenew?: boolean;
};

export type SubscribeResult = {
  subscription: Subscription;
  payment: Payment;
  message: string;
};

export type StudentSubscriptionItem = {
  id: string;
  plan: Subscription["plan"];
  planLabel: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: Subscription["status"];
  isCurrentlyActive: boolean;
  daysRemaining: number;
  autoRenew: boolean;
};

export type Coupon = BaseEntity & {
  code: string;
  discount: number;
  discountType: "percent" | "fixed";
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  status: "active" | "inactive" | "expired";
};

export type Blog = BaseEntity & {
  title: string;
  slug?: string;
  category: string;
  author: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  readTime?: string;
  status: "published" | "draft";
  publishedAt?: string;
};

export type Event = BaseEntity & {
  title: string;
  date: string;
  location: string;
  attendees: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
};

export type Testimonial = BaseEntity & {
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
  status: "published" | "draft";
};

export type GalleryItem = BaseEntity & {
  title: string;
  imageUrl: string;
  category: string;
  status: "published" | "draft";
};

export type CmsPage = BaseEntity & {
  title: string;
  slug: string;
  status: "published" | "draft";
  /** Plain text or simple HTML body shown on the public page */
  content: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type PaymentGatewayCredentials = {
  enabled: boolean;
  mode: "test" | "live";
  keyId: string;
  keySecret: string;
  webhookSecret: string;
};

export type PaymentGatewaysSettings = {
  razorpay: PaymentGatewayCredentials;
  cashfree: PaymentGatewayCredentials;
  /** Prefer this gateway when more than one is enabled */
  primary: "auto" | "razorpay" | "cashfree";
};

export type HomeCmsContent = {
  heroKicker: string;
  heroTitleLine1: string;
  heroHighlight1: string;
  heroTitleLine2: string;
  heroHighlight2: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type SiteCmsContent = {
  home: HomeCmsContent;
  footerTagline: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialYoutube: string;
};

export type FaqItem = BaseEntity & {
  question: string;
  answer: string;
  category: string;
  status: "published" | "draft";
  order: number;
};

export type Role = BaseEntity & {
  name: string;
  permissions: string[];
  userCount: number;
};

export type SystemLog = BaseEntity & {
  action: string;
  user: string;
  module: string;
  ip: string;
  level: "info" | "warning" | "error";
};

export type Activity = BaseEntity & {
  message: string;
  type: string;
  color: string;
  /** Target a specific user; when set, only that user (and admins) see it */
  userId?: string | null;
  /** Who should see this when userId is empty */
  audience?: "admin" | "instructor" | "student" | "all";
  /** User ids that have marked this notification as read */
  readBy?: string[];
  href?: string;
};

export type NewsletterSubscriber = BaseEntity & {
  email: string;
  status: "active" | "unsubscribed";
};

export type EmailOutboxItem = BaseEntity & {
  to: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "failed";
  relatedType?: string;
};

export type CertificateSigner = {
  name: string;
  title: string;
  signatureImage?: string;
};

export type CertificateSettings = {
  organizationName: string;
  organizationSubtitle: string;
  director: CertificateSigner;
  registrar: CertificateSigner;
};

export type AppSettings = {
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  certificate: CertificateSettings;
  paymentGateways: PaymentGatewaysSettings;
  cms: SiteCmsContent;
};

export type AdminDatabase = {
  users: User[];
  instructors: Instructor[];
  enrollments: Enrollment[];
  categories: Category[];
  courses: Course[];
  lessons: Lesson[];
  assignments: Assignment[];
  assignmentSubmissions: AssignmentSubmission[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  certificates: Certificate[];
  liveClasses: LiveClass[];
  payments: Payment[];
  orders: Order[];
  subscriptions: Subscription[];
  coupons: Coupon[];
  blogs: Blog[];
  events: Event[];
  testimonials: Testimonial[];
  gallery: GalleryItem[];
  cmsPages: CmsPage[];
  faq: FaqItem[];
  roles: Role[];
  systemLogs: SystemLog[];
  activities: Activity[];
  newsletterSubscribers: NewsletterSubscriber[];
  emailOutbox: EmailOutboxItem[];
  settings: AppSettings;
};

export type CollectionKey = keyof Omit<AdminDatabase, "settings">;

export type DashboardStats = {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  totalOrders: number;
  periodLabel: string;
  analytics: { month: string; students: number; enrollments: number; revenue: number }[];
  sparklines: {
    students: { v: number }[];
    instructors: { v: number }[];
    courses: { v: number }[];
    enrollments: { v: number }[];
    revenue: { v: number }[];
    orders: { v: number }[];
  };
  revenueBreakdown: { name: string; value: number; amount: number; color: string }[];
  enrollmentBreakdown: { name: string; value: number; count: number; color: string }[];
  countries: { name: string; count: number; pct: number; color: string }[];
  popularCourses: { title: string; enrollments: number; rating: number }[];
  recentActivities: Activity[];
};

export type CourseAdminDetail = CourseFullPayload & {
  instructorName: string;
  instructorEmail?: string;
  enrollments: Enrollment[];
  activeEnrollments: number;
};

export type CourseListItem = Course & {
  instructorName: string;
  lessonCount: number;
  sectionCount: number;
  liveClassCount: number;
  hasFinalExam: boolean;
  activeEnrollments: number;
};

export type CourseStats = {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalEnrollments: number;
};

export type CourseBuilderLessonQuizInput = {
  id?: string;
  durationMinutes: number;
  passingPercentage: number;
  maxAttempts: number;
  showResultsInstantly: boolean;
  questionItems: (Omit<ExamQuestion, "id"> & { id?: string })[];
};

export type CourseBuilderLessonInput = {
  id?: string;
  sectionId: string;
  title: string;
  description?: string;
  duration: string;
  order: number;
  status: "published" | "draft";
  lessonType: LessonType;
  content?: string;
  videoProvider?: VideoProvider;
  videoUrl?: string;
  isPrivateVideo?: boolean;
  quizId?: string;
  quiz?: CourseBuilderLessonQuizInput;
};

export type CourseBuilderFinalExamInput = {
  enabled: boolean;
  quizId?: string;
  title?: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  passingPercentage: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsInstantly: boolean;
  issueCertificateOnPass: boolean;
  certificateTemplate?: CertificateTemplateId;
  enableProctoring: boolean;
  maxProctorViolations: number;
  autoSubmitOnProctorViolation: boolean;
  requireFullscreen: boolean;
  questionItems: (Omit<ExamQuestion, "id"> & { id?: string })[];
};

export type CourseBuilderLiveClassInput = {
  id?: string;
  sectionId?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: string;
  platform: LiveClassPlatform;
  meetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  youtubeLiveUrl?: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
};

export type CourseBuilderInput = {
  title: string;
  shortDescription?: string;
  description: string;
  mainCategoryId: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  categoryId: string;
  instructorId: string;
  originalPrice: number;
  sellingPrice: number;
  level: "beginner" | "intermediate" | "advanced";
  status: "published" | "draft" | "archived";
  mode: CourseMode;
  duration: string;
  language?: string;
  requirements?: string[];
  outcomes?: string[];
  thumbnailUrl?: string;
  curriculum: CurriculumSection[];
  lessons: CourseBuilderLessonInput[];
  liveClasses: CourseBuilderLiveClassInput[];
  finalExam?: CourseBuilderFinalExamInput;
};

export type CourseFullPayload = {
  course: Course;
  lessons: Lesson[];
  liveClasses: LiveClass[];
  lessonQuizzes: Record<string, Quiz>;
  finalExam: Quiz | null;
};

export type CourseLearnLesson = {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  duration: string;
  order: number;
  lessonType: LessonType;
  content?: string;
  videoUrl?: string;
  videoId?: string;
  isPrivateVideo?: boolean;
  quizId?: string;
  quiz: {
    id: string;
    title: string;
    durationMinutes: number;
    totalMarks: number;
    passingPercentage: number;
    questions: number;
    maxAttempts: number;
    quizKind?: QuizKind;
  } | null;
};

export type CourseLearnPayload = {
  course: {
    id: string;
    title: string;
    description: string;
    shortDescription?: string;
    duration: string;
    level: Course["level"];
    instructorName: string;
    curriculum: CurriculumSection[];
  };
  lessons: CourseLearnLesson[];
  finalExam: CourseLearnLesson["quiz"];
  access?: {
    enrolled: boolean;
    preview: boolean;
    message?: string;
  };
};

export type QuizBuilderInput = {
  title: string;
  description?: string;
  courseId?: string;
  instructorId?: string;
  quizKind?: QuizKind;
  instructions?: string;
  durationMinutes: number;
  passingPercentage: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsInstantly: boolean;
  issueCertificateOnPass: boolean;
  certificateTemplate?: CertificateTemplateId;
  enableProctoring: boolean;
  maxProctorViolations: number;
  autoSubmitOnProctorViolation: boolean;
  requireFullscreen: boolean;
  status: "active" | "inactive" | "draft";
  questionItems: (Omit<ExamQuestion, "id"> & { id?: string })[];
};

export type ExamSubmitInput = {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: Record<string, string[]>;
  timeTakenSeconds: number;
  tabSwitchCount?: number;
  proctoringViolations?: ProctoringViolation[];
  autoSubmittedByProctor?: boolean;
};

export type ExamResultPayload = {
  attempt: QuizAttempt;
  certificate?: Certificate;
};

/* ---------- Public / student-facing payloads ---------- */

export type PublicCourseCard = {
  id: string;
  title: string;
  shortDescription?: string;
  instructorName: string;
  instructorId: string;
  categoryName: string;
  categoryId: string;
  originalPrice: number;
  sellingPrice: number;
  discountPercent: number;
  enrollments: number;
  rating: number;
  level: Course["level"];
  mode: CourseMode;
  duration: string;
  thumbnailUrl: string;
  lessonCount: number;
};

export type PublicInstructorCard = {
  id: string;
  name: string;
  slug: string;
  title: string;
  expertise: string;
  bio: string;
  courses: number;
  students: number;
  rating: number;
  avatarUrl: string;
  country?: string;
};

export type PublicBlogCard = {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  excerpt: string;
  coverImage: string;
  readTime: string;
  publishedAt: string;
};

export type HomePagePayload = {
  stats: {
    students: number;
    instructors: number;
    courses: number;
    certificates: number;
  };
  categories: { id: string; name: string; slug: string; courseCount: number }[];
  featuredCourses: PublicCourseCard[];
  instructors: PublicInstructorCard[];
  liveClasses: PublicLiveClassItem[];
  testimonials: Testimonial[];
  blogs: PublicBlogCard[];
  faqs: FaqItem[];
  cms: HomeCmsContent;
};

export type StudentDashboardPayload = {
  student: { id: string; name: string; email: string };
  kpis: {
    enrolledCourses: number;
    completedCourses: number;
    certificates: number;
    averageProgress: number;
  };
  myCourses: {
    id: string;
    courseId: string;
    title: string;
    progress: number;
    status: string;
    thumbnailUrl: string;
    duration: string;
  }[];
  assignments: {
    id: string;
    title: string;
    courseTitle: string;
    dueDate: string;
    status: string;
  }[];
  upcomingLive?: PublicLiveClassItem | null;
  certificates: number;
};

export type InstructorDashboardPayload = {
  instructor: {
    id: string;
    name: string;
    title: string;
    email?: string;
    avatarUrl?: string;
    rating: number;
  };
  kpis: {
    totalStudents: number;
    activeCourses: number;
    totalEarnings: number;
    avgRating: number;
    reviews: number;
  };
  myCourses: {
    id: string;
    title: string;
    students: number;
    rating: number;
    earnings: number;
    status: string;
    thumbnailUrl?: string | null;
  }[];
  recentStudents: {
    id: string;
    name: string;
    courseTitle: string;
    progress: number;
    enrolledAt: string;
  }[];
  revenueByMonth: number[];
};

