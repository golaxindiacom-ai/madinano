#!/usr/bin/env node
/**
 * Full feature smoke test for Navbharat Gurukulam
 */
const BASE = process.env.BASE_URL || "http://127.0.0.1:3210";
const results = [];
let pass = 0;
let fail = 0;

function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail });
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.json) {
    headers["content-type"] = "application/json";
    opts.body = JSON.stringify(opts.json);
  }
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body,
    redirect: "manual",
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, data, text, setCookie, headers: res.headers };
}

function mergeCookies(existing, setCookie) {
  const map = new Map();
  for (const part of (existing || "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const i = part.indexOf("=");
    if (i > 0) map.set(part.slice(0, i), part.slice(i + 1));
  }
  for (const c of setCookie) {
    const first = c.split(";")[0];
    const i = first.indexOf("=");
    if (i > 0) map.set(first.slice(0, i), first.slice(i + 1));
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function login(email, password) {
  const r = await req("/api/auth/login", {
    method: "POST",
    json: { email, password },
  });
  const cookie = mergeCookies("", r.setCookie);
  return { ...r, cookie };
}

async function main() {
  console.log(`\n=== Navbharat QA @ ${BASE} ===\n`);

  // 1. Public pages
  console.log("----- PUBLIC PAGES -----");
  for (const p of [
    "/",
    "/about",
    "/courses",
    "/instructors",
    "/blog",
    "/live-classes",
    "/pricing",
    "/faq",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
    "/exams",
    "/contact",
    "/checkout/success",
  ]) {
    const r = await req(p);
    check(`page ${p}`, r.status === 200, String(r.status));
  }

  // 2. Auth gates
  console.log("\n----- AUTH GATES -----");
  for (const p of [
    "/cart",
    "/dashboard",
    "/dashboard/orders",
    "/dashboard/payments",
    "/dashboard/subscription",
    "/admin",
  ]) {
    const r = await req(p);
    check(`gate ${p}`, r.status === 307 || r.status === 302, String(r.status));
  }

  // 3. Public APIs
  console.log("\n----- PUBLIC APIs -----");
  const publicApis = [
    "/api/home",
    "/api/courses",
    "/api/categories",
    "/api/instructors",
    "/api/blog",
    "/api/faq",
    "/api/testimonials",
    "/api/live-classes",
    "/api/subscriptions/plans",
    "/api/settings/public",
    "/api/exams",
  ];
  const apiCache = {};
  for (const p of publicApis) {
    const r = await req(p);
    apiCache[p] = r;
    const n = Array.isArray(r.data?.data)
      ? r.data.data.length
      : r.data?.data && typeof r.data.data === "object"
        ? Object.keys(r.data.data).length
        : 0;
    check(`api ${p}`, r.data?.success === true, `n=${n}`);
  }

  const courses = apiCache["/api/courses"].data.data;
  const CID = courses[0].id;
  const DCID = courses.find((c) => /Digital Marketing/i.test(c.title))?.id || courses[courses.length - 1].id;
  const ISLUG = apiCache["/api/instructors"].data.data[0].slug;
  const BSLUG = apiCache["/api/blog"].data.data[0].slug;
  const EID = apiCache["/api/exams"].data.data[0].id;

  // 4. Details
  console.log("\n----- DETAILS -----");
  for (const p of [
    `/courses/${CID}`,
    `/courses/${CID}/learn`,
    `/blog/${BSLUG}`,
    `/instructors/${ISLUG}`,
    `/exams/${EID}`,
  ]) {
    const r = await req(p);
    check(`page ${p}`, r.status === 200, String(r.status));
  }
  for (const p of [
    `/api/courses/${CID}`,
    `/api/blog/${BSLUG}`,
    `/api/instructors/${ISLUG}`,
    `/api/exams/${EID}`,
    `/api/courses/${CID}/learn`,
  ]) {
    const r = await req(p);
    check(`api ${p}`, r.data?.success === true);
  }

  const certNo = "NBG-CERT-2026-DEMO0001";
  {
    const r = await req(`/api/certificates/verify/${certNo}`);
    check("cert verify API", r.data?.success === true);
    const p = await req(`/certificates/verify/${certNo}`);
    check("cert verify page", p.status === 200, String(p.status));
  }

  // 5. Auth
  console.log("\n----- AUTH -----");
  {
    const bad = await req("/api/auth/login", {
      method: "POST",
      json: { email: "arjun.mehta@email.com", password: "wrong" },
    });
    check("bad login rejected", bad.status === 401 || bad.data?.success === false, String(bad.status));
  }

  const student = await login("arjun.mehta@email.com", "password123");
  check("student login", student.data?.success === true);

  const me = await req("/api/auth/me", { cookie: student.cookie });
  check("auth/me", me.data?.success === true && Boolean(me.data?.data?.email));

  const blocked = await req("/api/admin/dashboard", { cookie: student.cookie });
  check("student blocked from admin", blocked.status === 403 || blocked.data?.success === false);

  const dup = await req("/api/auth/signup", {
    method: "POST",
    json: { name: "Arjun", email: "arjun.mehta@email.com", password: "password123" },
  });
  check("duplicate signup rejected", dup.data?.success !== true);

  const admin = await login("admin@navbharatgurukulam.com", "password123");
  check("admin login", admin.data?.success === true);

  const instructor = await login("emma@navbharatgurukulam.com", "password123");
  check("instructor login", instructor.data?.success === true);

  // 6. Student features
  console.log("\n----- STUDENT FEATURES -----");
  for (const p of [
    "/api/certificates/mine",
    "/api/subscriptions/mine",
    "/api/orders/mine",
    "/api/payments/mine",
    "/api/dashboard/mine",
  ]) {
    const r = await req(p);
    check(`unauth 401 ${p}`, r.status === 401 || r.data?.success === false, String(r.status));
  }

  for (const p of [
    "/api/dashboard/mine",
    "/api/orders/mine",
    "/api/payments/mine",
    "/api/certificates/mine",
    "/api/subscriptions/mine",
    "/api/cart",
  ]) {
    const r = await req(p, { cookie: student.cookie });
    check(`student ${p}`, r.data?.success === true);
  }

  {
    const enrolled = await req(`/api/courses/${CID}/learn`, { cookie: student.cookie });
    check(
      "learn enrolled",
      enrolled.data?.data?.access?.enrolled === true,
      `lessons=${enrolled.data?.data?.lessons?.length ?? 0}`,
    );
    const preview = await req(`/api/courses/${CID}/learn`);
    check("learn guest preview", preview.data?.data?.access?.preview === true);
  }

  {
    const chk = await req(`/api/checkout/${CID}`, { cookie: student.cookie });
    const coupons = (chk.data?.data?.availableCoupons || []).map((c) => c.code).join(",");
    check("checkout + coupons", chk.data?.success === true, coupons || "no coupons");
  }

  {
    const r = await req("/api/cart/checkout", { method: "POST", json: {} });
    check("cart checkout requires login", r.status === 401 || r.data?.success === false);
  }

  {
    const r = await req("/api/contact", {
      method: "POST",
      json: {
        name: "QA Bot",
        email: "qa@test.com",
        message: "full feature check",
      },
    });
    check("contact form", r.data?.success === true, r.data?.error || "");
  }

  {
    const unauth = await req(`/api/exams/${EID}/start`, { method: "POST", json: {} });
    check("exam start requires login", unauth.status === 401 || unauth.data?.success === false);
    const auth = await req(`/api/exams/${EID}/start`, {
      method: "POST",
      json: {},
      cookie: student.cookie,
    });
    check(
      "exam start student",
      auth.data?.success === true,
      auth.data?.error || auth.data?.data?.attempt?.id || "",
    );
  }

  for (const p of [
    "/cart",
    "/dashboard",
    "/dashboard/orders",
    "/dashboard/payments",
    "/dashboard/subscription",
    "/pricing",
  ]) {
    const r = await req(p, { cookie: student.cookie });
    check(`student page ${p}`, r.status === 200, String(r.status));
  }

  // 7. Purchase
  console.log("\n----- PURCHASE -----");
  {
    const r = await req(`/api/checkout/${DCID}`, {
      method: "POST",
      cookie: student.cookie,
      json: {
        couponCode: "FLAT200",
        method: "upi",
        billingAddress: {
          fullName: "Arjun Mehta",
          email: "arjun.mehta@email.com",
          phone: "9999999999",
          addressLine1: "123 Street",
          city: "Bengaluru",
          state: "KA",
          pincode: "560001",
          country: "India",
        },
      },
    });
    const orderNo =
      r.data?.data?.order?.orderNo ||
      r.data?.data?.orderNo ||
      r.data?.error ||
      "";
    check("purchase with coupon+billing", r.data?.success === true, String(orderNo));
  }

  {
    const r = await req(`/api/cart?ids=${DCID}`, { cookie: student.cookie });
    check(
      "cart resolve items",
      r.data?.success === true,
      `items=${r.data?.data?.items?.length ?? 0}`,
    );
  }

  // 8. Admin
  console.log("\n----- ADMIN -----");
  const adminApis = [
    "/api/admin/dashboard",
    "/api/admin/courses",
    "/api/admin/users",
    "/api/admin/orders",
    "/api/admin/payments",
    "/api/admin/coupons",
    "/api/admin/blogs",
    "/api/admin/faq",
    "/api/admin/testimonials",
    "/api/admin/categories",
    "/api/admin/instructors",
    "/api/admin/lessons",
    "/api/admin/assignments",
    "/api/admin/quizzes",
    "/api/admin/certificates",
    "/api/admin/live-classes",
    "/api/admin/subscriptions",
    "/api/admin/quiz-attempts",
    "/api/admin/settings",
  ];
  for (const p of adminApis) {
    const r = await req(p, { cookie: admin.cookie });
    check(`admin ${p}`, r.data?.success === true, String(r.status));
  }

  for (const p of [
    "/admin",
    "/admin/courses",
    "/admin/users",
    "/admin/orders",
    "/admin/payments",
    "/admin/quizzes",
    "/admin/certificates",
    "/admin/categories",
    "/admin/instructors",
    "/admin/lessons",
    "/admin/assignments",
    "/admin/live-classes",
    "/admin/subscriptions",
    "/admin/exam-attempts",
    "/admin/blogs",
    "/admin/faq",
  ]) {
    const r = await req(p, { cookie: admin.cookie });
    check(`admin page ${p}`, r.status === 200, String(r.status));
  }

  {
    const r = await req("/api/instructor/dashboard?slug=john-smith", {
      cookie: instructor.cookie,
    });
    check("instructor dashboard API", r.data?.success === true);
    const page = await req("/instructor-dashboard", { cookie: instructor.cookie });
    check("instructor dashboard page", page.status === 200, String(page.status));
  }

  // 9. Logout
  console.log("\n----- LOGOUT -----");
  {
    await req("/api/auth/logout", { method: "POST", cookie: student.cookie });
    // cookie may still be sent; logout should clear server-side / set expired
    const after = await login("arjun.mehta@email.com", "password123");
    check("re-login after logout works", after.data?.success === true);
  }

  // Summary
  console.log(`\n=== TOTAL: ${pass} pass, ${fail} fail ===\n`);
  if (fail) {
    console.log("Failures:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  - ${r.name}${r.detail ? ` (${r.detail})` : ""}`);
    }
  }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
