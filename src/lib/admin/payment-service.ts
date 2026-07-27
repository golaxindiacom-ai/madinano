import { randomUUID } from "crypto";
import { pushActivity } from "@/lib/notifications/notification-service";
import {
  createCashfreeOrder,
  createRazorpayOrder,
  resolveActiveGateway,
} from "@/lib/payments/gateway";
import { getSettings, readDb, writeDb } from "./db";
import { normalizeCourse } from "./course-builder";
import { enrollUser } from "./user-service";
import type {
  AdminDatabase,
  BillingAddress,
  CartCheckoutInput,
  CartCheckoutResult,
  CheckoutCourseInfo,
  CheckoutInput,
  CheckoutPageData,
  CheckoutResult,
  FulfillOrderInput,
  Order,
  OrderDetailPayload,
  OrderInput,
  OrderListItem,
  OrderStats,
  Payment,
  PaymentDetailPayload,
  PaymentInput,
  PaymentListItem,
  PaymentStats,
  PublicCoupon,
  StudentOrderHistoryItem,
  StudentPaymentHistoryItem,
} from "./types";

const now = () => new Date().toISOString();

const METHOD_LABELS: Record<Payment["method"], string> = {
  card: "Card",
  upi: "UPI",
  paypal: "PayPal",
  bank: "Bank Transfer",
};

export function normalizePayment(raw: Record<string, unknown>): Payment {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    orderId: String(raw.orderId ?? ""),
    orderNo: raw.orderNo ? String(raw.orderNo) : undefined,
    userId: raw.userId ? String(raw.userId) : undefined,
    studentName: String(raw.studentName ?? ""),
    studentEmail: raw.studentEmail ? String(raw.studentEmail) : undefined,
    courseId: raw.courseId ? String(raw.courseId) : undefined,
    courseTitle: raw.courseTitle ? String(raw.courseTitle) : undefined,
    amount: Number(raw.amount ?? 0),
    method: (raw.method as Payment["method"]) ?? "upi",
    status: (raw.status as Payment["status"]) ?? "pending",
    transactionId: raw.transactionId ? String(raw.transactionId) : undefined,
  };
}

export function normalizeOrder(raw: Record<string, unknown>): Order {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    orderNo: String(raw.orderNo ?? ""),
    userId: raw.userId ? String(raw.userId) : undefined,
    studentName: String(raw.studentName ?? ""),
    studentEmail: raw.studentEmail ? String(raw.studentEmail) : undefined,
    courseId: raw.courseId ? String(raw.courseId) : undefined,
    courseTitle: String(raw.courseTitle ?? ""),
    amount: Number(raw.amount ?? 0),
    discount: raw.discount != null ? Number(raw.discount) : undefined,
    couponCode: raw.couponCode ? String(raw.couponCode) : undefined,
    status: (raw.status as Order["status"]) ?? "pending",
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    billingAddress: raw.billingAddress as BillingAddress | undefined,
  };
}

function findOrder(db: AdminDatabase, orderId: string) {
  return db.orders.find((o) => o.id === orderId || o.orderNo === orderId);
}

function enrichPayment(db: AdminDatabase, payment: Payment): PaymentListItem {
  const order = findOrder(db, payment.orderId);
  return {
    ...payment,
    orderNo: payment.orderNo ?? order?.orderNo ?? payment.orderId,
    courseTitle: payment.courseTitle ?? order?.courseTitle,
    methodLabel: METHOD_LABELS[payment.method] ?? payment.method,
  };
}

function getEnrollment(db: AdminDatabase, userId?: string, courseId?: string) {
  if (!userId || !courseId) return undefined;
  return (db.enrollments ?? []).find(
    (e) => e.userId === userId && e.courseId === courseId && e.status !== "dropped",
  );
}

function enrichOrder(db: AdminDatabase, order: Order): OrderListItem {
  const payment = order.paymentId
    ? db.payments.find((p) => p.id === order.paymentId)
    : db.payments.find((p) => p.orderId === order.id || p.orderId === order.orderNo);

  const normalizedPayment = payment
    ? normalizePayment(payment as unknown as Record<string, unknown>)
    : undefined;

  const enrollment = getEnrollment(db, order.userId, order.courseId);

  return {
    ...order,
    paymentStatus: normalizedPayment?.status,
    paymentMethod: normalizedPayment?.method,
    methodLabel: normalizedPayment ? METHOD_LABELS[normalizedPayment.method] : undefined,
    hasPayment: Boolean(normalizedPayment),
    isEnrolled: Boolean(enrollment),
    enrollmentId: enrollment?.id,
  };
}

function generateOrderNo(db: AdminDatabase) {
  const year = new Date().getFullYear();
  const count = db.orders.filter((o) => o.orderNo.startsWith(`ORD-${year}`)).length + 1;
  return `ORD-${year}-${String(count).padStart(4, "0")}`;
}

function generateTransactionId() {
  return `TXN-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function applyCoupon(db: AdminDatabase, code: string | undefined, amount: number) {
  if (!code?.trim()) return { amount, discount: 0, couponCode: undefined as string | undefined };

  const coupon = db.coupons.find(
    (c) => c.code.toLowerCase() === code.trim().toLowerCase() && c.status === "active",
  );
  if (!coupon) throw new Error("Invalid or expired coupon code");
  if (coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached");
  if (new Date(coupon.expiresAt) < new Date()) throw new Error("Coupon has expired");

  const discount =
    coupon.discountType === "percent"
      ? Math.round((amount * coupon.discount) / 100)
      : Math.min(coupon.discount, amount);

  return {
    amount: Math.max(0, amount - discount),
    discount,
    couponCode: coupon.code,
  };
}

function incrementCouponUsage(db: AdminDatabase, code?: string) {
  if (!code) return;
  const idx = db.coupons.findIndex((c) => c.code === code);
  if (idx !== -1) {
    db.coupons[idx] = {
      ...db.coupons[idx],
      usedCount: db.coupons[idx].usedCount + 1,
      updatedAt: now(),
    };
  }
}

function addActivity(
  db: AdminDatabase,
  message: string,
  type = "payment",
  extras?: { userId?: string; audience?: "admin" | "instructor" | "student" | "all"; href?: string },
) {
  pushActivity(db, {
    message,
    type,
    userId: extras?.userId,
    audience: extras?.audience || "admin",
    href: extras?.href,
  });
}

export async function getPaymentStats(): Promise<PaymentStats> {
  const db = await readDb();
  const payments = db.payments.map((p) =>
    normalizePayment(p as unknown as Record<string, unknown>),
  );
  const completed = payments.filter((p) => p.status === "completed");
  const todayStart = startOfDay();
  const monthStart = startOfMonth();

  return {
    total: payments.length,
    completed: completed.length,
    pending: payments.filter((p) => p.status === "pending").length,
    failed: payments.filter((p) => p.status === "failed").length,
    refunded: payments.filter((p) => p.status === "refunded").length,
    totalRevenue: completed.reduce((s, p) => s + p.amount, 0),
    todayRevenue: completed
      .filter((p) => new Date(p.createdAt) >= todayStart)
      .reduce((s, p) => s + p.amount, 0),
    thisMonthRevenue: completed
      .filter((p) => new Date(p.createdAt) >= monthStart)
      .reduce((s, p) => s + p.amount, 0),
  };
}

export async function getOrderStats(): Promise<OrderStats> {
  const db = await readDb();
  const orders = db.orders.map((o) => enrichOrder(db, normalizeOrder(o as unknown as Record<string, unknown>)));
  const completed = orders.filter((o) => o.status === "completed");

  return {
    total: orders.length,
    completed: completed.length,
    pending: orders.filter((o) => o.status === "pending").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
    totalValue: completed.reduce((s, o) => s + o.amount, 0),
    averageOrderValue: completed.length
      ? Math.round(completed.reduce((s, o) => s + o.amount, 0) / completed.length)
      : 0,
    awaitingPayment: orders.filter((o) => o.status === "pending" && !o.hasPayment).length,
    awaitingEnrollment: orders.filter((o) => o.status === "completed" && !o.isEnrolled).length,
  };
}

export type ListPaymentsOptions = {
  search?: string;
  status?: Payment["status"] | "all";
  method?: Payment["method"] | "all";
};

export async function listPayments(options: ListPaymentsOptions = {}): Promise<PaymentListItem[]> {
  const db = await readDb();
  let payments = db.payments.map((p) =>
    normalizePayment(p as unknown as Record<string, unknown>),
  );

  if (options.status && options.status !== "all") {
    payments = payments.filter((p) => p.status === options.status);
  }
  if (options.method && options.method !== "all") {
    payments = payments.filter((p) => p.method === options.method);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    payments = payments.filter((p) => {
      const enriched = enrichPayment(db, p);
      return [p.studentName, p.studentEmail, enriched.orderNo, enriched.courseTitle, p.transactionId].some(
        (v) => String(v ?? "").toLowerCase().includes(q),
      );
    });
  }

  return payments
    .map((p) => enrichPayment(db, p))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export type ListOrdersOptions = {
  search?: string;
  status?: Order["status"] | "all";
  courseId?: string;
  awaitingPayment?: boolean;
  awaitingEnrollment?: boolean;
};

export async function listOrders(options: ListOrdersOptions = {}): Promise<OrderListItem[]> {
  const db = await readDb();
  let orders = db.orders.map((o) => normalizeOrder(o as unknown as Record<string, unknown>));

  if (options.status && options.status !== "all") {
    orders = orders.filter((o) => o.status === options.status);
  }
  if (options.courseId) {
    orders = orders.filter((o) => o.courseId === options.courseId);
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    orders = orders.filter((o) =>
      [o.orderNo, o.studentName, o.studentEmail, o.courseTitle, o.couponCode].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }

  let enriched = orders.map((o) => enrichOrder(db, o));

  if (options.awaitingPayment) {
    enriched = enriched.filter((o) => o.status === "pending" && !o.hasPayment);
  }
  if (options.awaitingEnrollment) {
    enriched = enriched.filter((o) => o.status === "completed" && !o.isEnrolled);
  }

  return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPaymentDetail(id: string): Promise<PaymentDetailPayload | null> {
  const db = await readDb();
  const raw = db.payments.find((p) => p.id === id);
  if (!raw) return null;

  const payment = enrichPayment(db, normalizePayment(raw as unknown as Record<string, unknown>));
  const orderRaw = findOrder(db, payment.orderId);

  return {
    payment,
    order: orderRaw ? enrichOrder(db, normalizeOrder(orderRaw as unknown as Record<string, unknown>)) : undefined,
  };
}

export async function getOrderDetail(id: string): Promise<OrderDetailPayload | null> {
  const db = await readDb();
  const raw = db.orders.find((o) => o.id === id);
  if (!raw) return null;

  const order = enrichOrder(db, normalizeOrder(raw as unknown as Record<string, unknown>));
  const paymentRaw = order.paymentId
    ? db.payments.find((p) => p.id === order.paymentId)
    : db.payments.find((p) => p.orderId === order.id || p.orderId === order.orderNo);

  const enrollment = getEnrollment(db, order.userId, order.courseId);

  return {
    order,
    payment: paymentRaw
      ? enrichPayment(db, normalizePayment(paymentRaw as unknown as Record<string, unknown>))
      : undefined,
    enrollment: enrollment
      ? {
          id: enrollment.id,
          progress: enrollment.progress,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
        }
      : undefined,
  };
}

function validateOrderInput(input: OrderInput, db: AdminDatabase): string | null {
  if (!input.studentName?.trim()) return "Student name is required";
  if (!input.courseId) return "Course is required";
  if (input.amount == null || input.amount < 0) return "Invalid amount";
  if (!["pending", "completed", "cancelled", "refunded"].includes(input.status)) {
    return "Invalid status";
  }

  const courseRaw = db.courses.find((c) => c.id === input.courseId);
  if (!courseRaw) return "Course not found";

  if (input.userId) {
    const user = db.users.find((u) => u.id === input.userId);
    if (!user) return "Student not found";
    if (user.role !== "student") return "Selected user must be a student";
  }

  return null;
}

export async function createOrder(input: OrderInput): Promise<OrderListItem> {
  const db = await readDb();
  const err = validateOrderInput(input, db);
  if (err) throw new Error(err);

  const course = normalizeCourse(
    db.courses.find((c) => c.id === input.courseId)! as unknown as Record<string, unknown>,
  );
  const user = input.userId ? db.users.find((u) => u.id === input.userId) : undefined;
  const ts = now();

  const order: Order = {
    id: randomUUID(),
    orderNo: generateOrderNo(db),
    userId: user?.id,
    studentName: user?.name ?? input.studentName.trim(),
    studentEmail: user?.email ?? input.studentEmail?.trim(),
    courseId: course.id,
    courseTitle: course.title,
    amount: Number(input.amount),
    discount: input.discount != null ? Number(input.discount) : undefined,
    couponCode: input.couponCode?.trim() || undefined,
    status: input.status,
    createdAt: ts,
    updatedAt: ts,
  };

  db.orders.unshift(order);
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichOrder(dbFresh, order);
}

export async function fulfillOrder(
  id: string,
  options: FulfillOrderInput = {},
): Promise<OrderDetailPayload> {
  const db = await readDb();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error("Order not found");

  const order = normalizeOrder(db.orders[idx] as unknown as Record<string, unknown>);
  if (order.status === "cancelled") throw new Error("Cannot fulfill a cancelled order");

  const ts = now();
  let paymentId = order.paymentId;

  const existingPayment = paymentId
    ? db.payments.find((p) => p.id === paymentId)
    : db.payments.find((p) => p.orderId === order.id || p.orderId === order.orderNo);

  if (!existingPayment) {
    const payment: Payment = {
      id: randomUUID(),
      orderId: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      studentName: order.studentName,
      studentEmail: order.studentEmail,
      courseId: order.courseId,
      courseTitle: order.courseTitle,
      amount: order.amount,
      method: options.method ?? "upi",
      status: "completed",
      transactionId: generateTransactionId(),
      createdAt: ts,
      updatedAt: ts,
    };
    db.payments.unshift(payment);
    paymentId = payment.id;
  } else {
    const pIdx = db.payments.findIndex((p) => p.id === existingPayment.id);
    if (pIdx !== -1) {
      db.payments[pIdx] = {
        ...db.payments[pIdx],
        status: "completed",
        updatedAt: ts,
      };
    }
    paymentId = existingPayment.id;
  }

  db.orders[idx] = {
    ...db.orders[idx],
    status: "completed",
    paymentId,
    updatedAt: ts,
  };

  addActivity(db, `Order ${order.orderNo} fulfilled for ${order.studentName}`, "payment", {
    audience: "admin",
    href: "/admin/orders",
  });
  if (order.userId) {
    addActivity(
      db,
      `Your order ${order.orderNo} is complete${order.courseTitle ? ` — ${order.courseTitle}` : ""}`,
      "payment",
      { userId: order.userId, audience: "student", href: "/dashboard/orders" },
    );
  }
  await writeDb(db);

  if (options.enroll !== false && order.userId && order.courseId) {
    try {
      await enrollUser(order.userId, order.courseId);
    } catch {
      /* already enrolled */
    }
  }

  const detail = await getOrderDetail(id);
  if (!detail) throw new Error("Order not found after fulfill");
  return detail;
}

export async function enrollOrderStudent(id: string): Promise<OrderDetailPayload> {
  const db = await readDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw new Error("Order not found");
  if (!order.userId || !order.courseId) throw new Error("Order missing student or course link");

  await enrollUser(order.userId, order.courseId);
  const detail = await getOrderDetail(id);
  if (!detail) throw new Error("Order not found");
  return detail;
}

export async function listStudentsForOrders() {
  const db = await readDb();
  return db.users
    .filter((u) => u.role === "student")
    .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createManualPayment(input: PaymentInput): Promise<PaymentListItem> {
  const db = await readDb();
  const order = findOrder(db, input.orderId);
  if (!order) throw new Error("Order not found");

  const ts = now();
  const payment: Payment = {
    id: randomUUID(),
    orderId: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    studentName: input.studentName.trim() || order.studentName,
    studentEmail: input.studentEmail?.trim() || order.studentEmail,
    courseId: order.courseId,
    courseTitle: order.courseTitle,
    amount: Number(input.amount),
    method: input.method,
    status: input.status,
    transactionId: input.transactionId?.trim() || generateTransactionId(),
    createdAt: ts,
    updatedAt: ts,
  };

  db.payments.unshift(payment);

  const orderIdx = db.orders.findIndex((o) => o.id === order.id);
  if (orderIdx !== -1) {
    db.orders[orderIdx] = {
      ...db.orders[orderIdx],
      paymentId: payment.id,
      status: input.status === "completed" ? "completed" : db.orders[orderIdx].status,
      updatedAt: ts,
    };
  }

  await writeDb(db);
  const dbFresh = await readDb();
  return enrichPayment(dbFresh, payment);
}

export async function updatePaymentStatus(
  id: string,
  status: Payment["status"],
): Promise<PaymentListItem | null> {
  const db = await readDb();
  const idx = db.payments.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const payment = normalizePayment(db.payments[idx] as unknown as Record<string, unknown>);
  db.payments[idx] = { ...payment, status, updatedAt: now() };

  const order = findOrder(db, payment.orderId);
  if (order) {
    const orderIdx = db.orders.findIndex((o) => o.id === order.id);
    if (orderIdx !== -1) {
      const orderStatus =
        status === "completed"
          ? "completed"
          : status === "refunded"
            ? "refunded"
            : status === "failed"
              ? "pending"
              : db.orders[orderIdx].status;
      db.orders[orderIdx] = { ...db.orders[orderIdx], status: orderStatus, updatedAt: now() };
    }
  }

  await writeDb(db);
  const dbFresh = await readDb();
  return enrichPayment(dbFresh, db.payments[idx] as Payment);
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<OrderListItem | null> {
  const db = await readDb();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;

  db.orders[idx] = { ...db.orders[idx], status, updatedAt: now() };
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichOrder(dbFresh, db.orders[idx] as Order);
}

export async function deletePayment(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.payments.length;
  db.payments = db.payments.filter((p) => p.id !== id);
  if (db.payments.length === before) return false;
  await writeDb(db);
  return true;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const db = await readDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) return false;
  if (order.status === "completed") throw new Error("Cannot delete completed orders");

  db.orders = db.orders.filter((o) => o.id !== id);
  db.payments = db.payments.filter((p) => p.orderId !== id && p.orderId !== order.orderNo);
  await writeDb(db);
  return true;
}

export async function listCoursesForOrders() {
  const db = await readDb();
  return db.courses
    .map((c) => normalizeCourse(c as unknown as Record<string, unknown>))
    .filter((c) => c.status === "published")
    .map((c) => ({ id: c.id, title: c.title, sellingPrice: c.sellingPrice }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getPaymentMethodOptions() {
  return Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }));
}

function validateBillingAddress(address: BillingAddress) {
  if (!address.fullName?.trim()) throw new Error("Billing name is required");
  if (!address.phone?.trim()) throw new Error("Phone number is required");
  if (!address.email?.trim()) throw new Error("Billing email is required");
  if (!address.addressLine1?.trim()) throw new Error("Address line 1 is required");
  if (!address.city?.trim()) throw new Error("City is required");
  if (!address.state?.trim()) throw new Error("State is required");
  if (!address.pincode?.trim()) throw new Error("Pincode is required");
  if (!address.country?.trim()) throw new Error("Country is required");
}

export function listActiveCoupons(db: AdminDatabase): PublicCoupon[] {
  const nowDate = new Date();
  return db.coupons
    .filter(
      (coupon) =>
        coupon.status === "active" &&
        coupon.usedCount < coupon.usageLimit &&
        new Date(coupon.expiresAt) >= nowDate,
    )
    .map((coupon) => ({
      code: coupon.code,
      discount: coupon.discount,
      discountType: coupon.discountType,
      expiresAt: coupon.expiresAt,
      description:
        coupon.discountType === "percent"
          ? `${coupon.discount}% off your order`
          : `₹${coupon.discount} off your order`,
    }));
}

export async function getCheckoutPageData(courseId: string): Promise<CheckoutPageData | null> {
  const db = await readDb();
  const course = await getCheckoutCourse(courseId);
  if (!course) return null;
  return {
    ...course,
    availableCoupons: listActiveCoupons(db),
  };
}

export async function getCartItems(courseIds: string[]): Promise<CheckoutCourseInfo[]> {
  const uniqueIds = [...new Set(courseIds.filter(Boolean))];
  const items: CheckoutCourseInfo[] = [];
  for (const courseId of uniqueIds) {
    const course = await getCheckoutCourse(courseId);
    if (course) items.push(course);
  }
  return items;
}

export async function getCheckoutCourse(courseId: string): Promise<CheckoutCourseInfo | null> {
  const db = await readDb();
  const raw = db.courses.find((c) => c.id === courseId);
  if (!raw) return null;

  const course = normalizeCourse(raw as unknown as Record<string, unknown>);
  if (course.status !== "published") return null;

  const instructor = db.instructors.find((i) => i.id === course.instructorId);

  return {
    id: course.id,
    title: course.title,
    instructorName: instructor?.name ?? "Instructor",
    sellingPrice: course.sellingPrice,
    originalPrice: course.originalPrice,
    thumbnailUrl: course.thumbnailUrl,
    duration: course.duration,
    level: course.level,
  };
}

export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const db = await readDb();
  validateBillingAddress(input.billingAddress);

  const user = db.users.find((u) => u.id === input.userId);
  if (!user) throw new Error("Student not found");
  if (user.role !== "student") throw new Error("Only students can purchase courses");
  if (user.status !== "active") throw new Error("Your account is not active");

  const courseRaw = db.courses.find((c) => c.id === input.courseId);
  if (!courseRaw) throw new Error("Course not found");
  const course = normalizeCourse(courseRaw as unknown as Record<string, unknown>);
  if (course.status !== "published") throw new Error("Course is not available for purchase");

  const existing = (db.enrollments ?? []).find(
    (e) => e.userId === input.userId && e.courseId === input.courseId && e.status !== "dropped",
  );
  if (existing) throw new Error("You are already enrolled in this course");

  const pricing = applyCoupon(db, input.couponCode, course.sellingPrice);
  const ts = now();
  const orderId = randomUUID();
  const paymentId = randomUUID();
  const orderNo = generateOrderNo(db);
  const transactionId = generateTransactionId();
  const billingAddress: BillingAddress = {
    fullName: input.billingAddress.fullName.trim(),
    phone: input.billingAddress.phone.trim(),
    email: input.billingAddress.email.trim(),
    addressLine1: input.billingAddress.addressLine1.trim(),
    addressLine2: input.billingAddress.addressLine2?.trim() || undefined,
    city: input.billingAddress.city.trim(),
    state: input.billingAddress.state.trim(),
    pincode: input.billingAddress.pincode.trim(),
    country: input.billingAddress.country.trim(),
  };

  const order: Order = {
    id: orderId,
    orderNo,
    userId: user.id,
    studentName: billingAddress.fullName,
    studentEmail: billingAddress.email,
    courseId: course.id,
    courseTitle: course.title,
    amount: pricing.amount,
    discount: pricing.discount || undefined,
    couponCode: pricing.couponCode,
    status: "pending",
    paymentId,
    billingAddress,
    createdAt: ts,
    updatedAt: ts,
  };

  const payment: Payment = {
    id: paymentId,
    orderId: orderId,
    orderNo,
    userId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    courseId: course.id,
    courseTitle: course.title,
    amount: pricing.amount,
    method: input.method,
    status: "pending",
    transactionId,
    createdAt: ts,
    updatedAt: ts,
  };

  const settings = await getSettings();
  const activeGateway = resolveActiveGateway(settings.paymentGateways);

  if (activeGateway === "demo") {
    payment.status = "completed";
    order.status = "completed";
    db.orders.unshift(order);
    db.payments.unshift(payment);
    incrementCouponUsage(db, pricing.couponCode);
    addActivity(db, `Payment of ₹${pricing.amount.toLocaleString("en-IN")} received from ${user.name}`, "payment", {
      audience: "admin",
      href: "/admin/payments",
    });
    addActivity(
      db,
      `Payment of ₹${pricing.amount.toLocaleString("en-IN")} confirmed for ${course.title}`,
      "payment",
      { userId: user.id, audience: "student", href: "/dashboard/payments" },
    );
    await writeDb(db);

    let enrolled = false;
    try {
      await enrollUser(user.id, course.id);
      enrolled = true;
    } catch {
      enrolled = false;
    }

    return {
      order,
      payment,
      enrolled,
      message: enrolled
        ? "Payment successful! You are now enrolled in the course."
        : "Payment successful! Enrollment will be completed shortly.",
      gateway: {
        provider: "demo",
        amount: pricing.amount,
        currency: settings.currency || "INR",
        paymentId,
        orderNo,
        studentName: billingAddress.fullName,
        studentEmail: billingAddress.email,
      },
    };
  }

  // Live gateway: keep pending until verified
  db.orders.unshift(order);
  db.payments.unshift(payment);
  await writeDb(db);

  if (activeGateway === "razorpay") {
    const rz = await createRazorpayOrder({
      amountInr: pricing.amount,
      receipt: orderNo,
      notes: { paymentId, orderId, courseId: course.id, userId: user.id },
    });
    return {
      order,
      payment,
      enrolled: false,
      message: "Complete payment with Razorpay to activate enrollment.",
      gateway: {
        provider: "razorpay",
        keyId: rz.keyId,
        orderId: rz.orderId,
        amount: pricing.amount,
        currency: settings.currency || "INR",
        paymentId,
        orderNo,
        studentName: billingAddress.fullName,
        studentEmail: billingAddress.email,
      },
    };
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://127.0.0.1:3210";
  const cf = await createCashfreeOrder({
    amountInr: pricing.amount,
    orderId: orderNo,
    customerId: user.id,
    customerEmail: billingAddress.email,
    customerPhone: billingAddress.phone,
    customerName: billingAddress.fullName,
    returnUrl: `${origin}/checkout/success?order=${encodeURIComponent(orderNo)}&course=${encodeURIComponent(course.id)}&paymentId=${encodeURIComponent(paymentId)}&provider=cashfree`,
  });

  return {
    order,
    payment,
    enrolled: false,
    message: "Complete payment with Cashfree to activate enrollment.",
    gateway: {
      provider: "cashfree",
      keyId: cf.keyId,
      orderId: cf.orderId,
      paymentSessionId: cf.paymentSessionId,
      amount: pricing.amount,
      currency: settings.currency || "INR",
      paymentId,
      orderNo,
      studentName: billingAddress.fullName,
      studentEmail: billingAddress.email,
    },
  };
}

export async function fulfillGatewayPayment(input: {
  paymentId: string;
  userId: string;
  transactionId: string;
  gatewayOrderId?: string;
}): Promise<CheckoutResult> {
  const db = await readDb();
  const paymentIdx = db.payments.findIndex((p) => p.id === input.paymentId);
  if (paymentIdx === -1) throw new Error("Payment not found");
  const payment = db.payments[paymentIdx];
  if (payment.userId && payment.userId !== input.userId) {
    throw new Error("Payment does not belong to this account");
  }

  const orderIdx = db.orders.findIndex((o) => o.id === payment.orderId);
  if (orderIdx === -1) throw new Error("Order not found");
  const order = db.orders[orderIdx];

  if (payment.status === "completed" && order.status === "completed") {
    return {
      order,
      payment,
      enrolled: true,
      message: "Payment already completed.",
    };
  }

  const ts = now();
  db.payments[paymentIdx] = {
    ...payment,
    status: "completed",
    transactionId: input.transactionId,
    updatedAt: ts,
  };
  db.orders[orderIdx] = {
    ...order,
    status: "completed",
    updatedAt: ts,
  };

  if (order.couponCode) incrementCouponUsage(db, order.couponCode);

  addActivity(
    db,
    `Payment of ₹${payment.amount.toLocaleString("en-IN")} received from ${payment.studentName}`,
    "payment",
    { audience: "admin", href: "/admin/payments" },
  );
  if (payment.userId) {
    addActivity(
      db,
      `Payment of ₹${payment.amount.toLocaleString("en-IN")} confirmed${payment.courseTitle ? ` for ${payment.courseTitle}` : ""}`,
      "payment",
      { userId: payment.userId, audience: "student", href: "/dashboard/payments" },
    );
  }
  await writeDb(db);

  let enrolled = false;
  if (order.userId && order.courseId) {
    try {
      await enrollUser(order.userId, order.courseId);
      enrolled = true;
    } catch {
      enrolled = Boolean(
        (await readDb()).enrollments.find(
          (e) => e.userId === order.userId && e.courseId === order.courseId && e.status !== "dropped",
        ),
      );
    }
  }

  return {
    order: db.orders[orderIdx],
    payment: db.payments[paymentIdx],
    enrolled,
    message: enrolled
      ? "Payment successful! You are now enrolled in the course."
      : "Payment successful! Enrollment will be completed shortly.",
  };
}

export async function processCartCheckout(input: CartCheckoutInput): Promise<CartCheckoutResult> {
  if (!input.courseIds.length) throw new Error("Cart is empty");
  validateBillingAddress(input.billingAddress);

  const db = await readDb();
  const user = db.users.find((u) => u.id === input.userId);
  if (!user) throw new Error("Student not found");
  if (user.role !== "student") throw new Error("Only students can purchase courses");
  if (user.status !== "active") throw new Error("Your account is not active");

  const billingAddress: BillingAddress = {
    fullName: input.billingAddress.fullName.trim(),
    phone: input.billingAddress.phone.trim(),
    email: input.billingAddress.email.trim(),
    addressLine1: input.billingAddress.addressLine1.trim(),
    addressLine2: input.billingAddress.addressLine2?.trim() || undefined,
    city: input.billingAddress.city.trim(),
    state: input.billingAddress.state.trim(),
    pincode: input.billingAddress.pincode.trim(),
    country: input.billingAddress.country.trim(),
  };

  const uniqueCourseIds = [...new Set(input.courseIds)];
  const purchasable = uniqueCourseIds
    .map((courseId) => {
      const raw = db.courses.find((c) => c.id === courseId);
      if (!raw) return null;
      const course = normalizeCourse(raw as unknown as Record<string, unknown>);
      if (course.status !== "published") return null;
      const enrolled = (db.enrollments ?? []).some(
        (e) => e.userId === input.userId && e.courseId === course.id && e.status !== "dropped",
      );
      if (enrolled) return null;
      return course;
    })
    .filter((course): course is ReturnType<typeof normalizeCourse> => Boolean(course));

  if (!purchasable.length) throw new Error("No purchasable courses in cart");

  const subtotal = purchasable.reduce((sum, course) => sum + course.sellingPrice, 0);
  const cartPricing = applyCoupon(db, input.couponCode, subtotal);
  let remainingDiscount = cartPricing.discount;

  const results: CheckoutResult[] = [];
  let totalPaid = 0;
  const ts = now();

  for (let index = 0; index < purchasable.length; index++) {
    const course = purchasable[index];
    let courseDiscount = 0;
    if (cartPricing.discount > 0) {
      if (index === purchasable.length - 1) {
        courseDiscount = remainingDiscount;
      } else {
        courseDiscount = Math.round((course.sellingPrice / subtotal) * cartPricing.discount);
        remainingDiscount -= courseDiscount;
      }
    }

    const amount = Math.max(0, course.sellingPrice - courseDiscount);
    const orderId = randomUUID();
    const paymentId = randomUUID();
    const orderNo = generateOrderNo(db);
    const transactionId = generateTransactionId();

    const order: Order = {
      id: orderId,
      orderNo,
      userId: user.id,
      studentName: billingAddress.fullName,
      studentEmail: billingAddress.email,
      courseId: course.id,
      courseTitle: course.title,
      amount,
      discount: courseDiscount || undefined,
      couponCode: courseDiscount > 0 ? cartPricing.couponCode : undefined,
      status: "completed",
      paymentId,
      billingAddress,
      createdAt: ts,
      updatedAt: ts,
    };

    const payment: Payment = {
      id: paymentId,
      orderId,
      orderNo,
      userId: user.id,
      studentName: billingAddress.fullName,
      studentEmail: billingAddress.email,
      courseId: course.id,
      courseTitle: course.title,
      amount,
      method: input.method,
      status: "completed",
      transactionId,
      createdAt: ts,
      updatedAt: ts,
    };

    db.orders.unshift(order);
    db.payments.unshift(payment);
    totalPaid += amount;

    results.push({
      order,
      payment,
      enrolled: false,
      message: "Payment recorded",
    });
  }

  if (cartPricing.couponCode) incrementCouponUsage(db, cartPricing.couponCode);
  addActivity(
    db,
    `Cart payment of ₹${totalPaid.toLocaleString("en-IN")} received from ${billingAddress.fullName}`,
    "payment",
    { audience: "admin", href: "/admin/payments" },
  );
  addActivity(
    db,
    `Your cart payment of ₹${totalPaid.toLocaleString("en-IN")} was successful`,
    "payment",
    { userId: input.userId, audience: "student", href: "/dashboard/orders" },
  );
  await writeDb(db);

  for (const result of results) {
    if (!result.order.courseId) continue;
    try {
      await enrollUser(input.userId, result.order.courseId);
      result.enrolled = true;
      result.message = "Enrolled successfully";
    } catch {
      result.enrolled = false;
    }
  }

  return {
    results,
    totalPaid,
    message: `Payment successful for ${results.length} course${results.length > 1 ? "s" : ""}.`,
  };
}

export async function listStudentPayments(userId: string): Promise<StudentPaymentHistoryItem[]> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);

  return db.payments
    .map((p) => normalizePayment(p as unknown as Record<string, unknown>))
    .filter((p) => p.userId === userId || (user && p.studentEmail === user.email))
    .map((p) => {
      const enriched = enrichPayment(db, p);
      return {
        id: p.id,
        orderNo: enriched.orderNo,
        courseTitle: enriched.courseTitle ?? "—",
        amount: p.amount,
        method: p.method,
        methodLabel: enriched.methodLabel,
        status: p.status,
        transactionId: p.transactionId,
        createdAt: p.createdAt,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listStudentOrders(userId: string): Promise<StudentOrderHistoryItem[]> {
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);

  return db.orders
    .map((o) => normalizeOrder(o as unknown as Record<string, unknown>))
    .filter((o) => o.userId === userId || (user && o.studentEmail === user.email))
    .map((o) => {
      const enriched = enrichOrder(db, o);
      return {
        id: o.id,
        orderNo: o.orderNo,
        courseTitle: o.courseTitle,
        amount: o.amount,
        discount: o.discount,
        couponCode: o.couponCode,
        status: o.status,
        hasPayment: enriched.hasPayment,
        isEnrolled: enriched.isEnrolled,
        createdAt: o.createdAt,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function validateCoupon(code: string, courseId: string) {
  const db = await readDb();
  const courseRaw = db.courses.find((c) => c.id === courseId);
  if (!courseRaw) throw new Error("Course not found");
  const course = normalizeCourse(courseRaw as unknown as Record<string, unknown>);
  const pricing = applyCoupon(db, code, course.sellingPrice);
  return {
    code: pricing.couponCode!,
    originalPrice: course.sellingPrice,
    finalPrice: pricing.amount,
    discount: pricing.discount,
  };
}

export async function validateCartCoupon(code: string, courseIds: string[]) {
  const db = await readDb();
  const subtotal = courseIds.reduce((sum, courseId) => {
    const raw = db.courses.find((c) => c.id === courseId);
    if (!raw) return sum;
    const course = normalizeCourse(raw as unknown as Record<string, unknown>);
    return course.status === "published" ? sum + course.sellingPrice : sum;
  }, 0);
  if (!subtotal) throw new Error("Cart is empty");

  const pricing = applyCoupon(db, code, subtotal);
  return {
    code: pricing.couponCode!,
    originalPrice: subtotal,
    finalPrice: pricing.amount,
    discount: pricing.discount,
  };
}
