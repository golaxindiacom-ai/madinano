import { randomUUID } from "crypto";
import type { AdminDatabase, Order, Payment } from "./types";

export function migrateOrdersAndPayments(db: AdminDatabase): boolean {
  let dirty = false;

  if (!db.orders) db.orders = [];
  if (!db.payments) db.payments = [];
  if (!db.users) db.users = [];
  if (!db.courses) db.courses = [];

  for (const order of db.orders) {
    const user =
      (order.userId ? db.users.find((u) => u.id === order.userId) : undefined) ??
      db.users.find((u) => u.name === order.studentName) ??
      (order.studentEmail ? db.users.find((u) => u.email === order.studentEmail) : undefined);

    if (!user && order.studentName) {
      const created = {
        id: randomUUID(),
        name: order.studentName,
        email: order.studentEmail ?? `${order.studentName.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        role: "student" as const,
        status: "active" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(created);
      order.userId = created.id;
      order.studentEmail = created.email;
      dirty = true;
    } else if (user) {
      if (order.userId !== user.id) {
        order.userId = user.id;
        dirty = true;
      }
      if (!order.studentEmail && user.email) {
        order.studentEmail = user.email;
        dirty = true;
      }
    }

    const course =
      (order.courseId ? db.courses.find((c) => c.id === order.courseId) : undefined) ??
      db.courses.find((c) => c.title === order.courseTitle);

    if (course && order.courseId !== course.id) {
      order.courseId = course.id;
      order.courseTitle = course.title;
      dirty = true;
    }
  }

  for (const payment of db.payments) {
    const order = db.orders.find(
      (o) => o.id === payment.orderId || o.orderNo === payment.orderId,
    );

    if (order) {
      if (payment.orderId !== order.id) {
        payment.orderId = order.id;
        dirty = true;
      }
      if (payment.orderNo !== order.orderNo) {
        payment.orderNo = order.orderNo;
        dirty = true;
      }
      if (!payment.userId && order.userId) {
        payment.userId = order.userId;
        dirty = true;
      }
      if (!payment.studentEmail && order.studentEmail) {
        payment.studentEmail = order.studentEmail;
        dirty = true;
      }
      if (!payment.courseId && order.courseId) {
        payment.courseId = order.courseId;
        payment.courseTitle = order.courseTitle;
        dirty = true;
      }
      if (!order.paymentId) {
        order.paymentId = payment.id;
        dirty = true;
      }
      if (!payment.transactionId) {
        payment.transactionId = `TXN-MIG-${payment.id.slice(0, 8).toUpperCase()}`;
        dirty = true;
      }
    }
  }

  for (const order of db.orders) {
    if (!order.paymentId) {
      const payment = db.payments.find(
        (p) => p.orderId === order.id || p.orderId === order.orderNo,
      );
      if (payment) {
        order.paymentId = payment.id;
        dirty = true;
      }
    }
  }

  return dirty;
}

export function normalizeLegacyOrder(order: Order): Order {
  return {
    ...order,
    amount: Number(order.amount ?? 0),
    discount: order.discount != null ? Number(order.discount) : undefined,
  };
}

export function normalizeLegacyPayment(payment: Payment): Payment {
  return {
    ...payment,
    amount: Number(payment.amount ?? 0),
  };
}
