import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionTokenAsync } from "@/lib/auth/session-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionTokenAsync(token);

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isProtectedStudent =
    pathname.startsWith("/dashboard") ||
    pathname === "/cart" ||
    (pathname.startsWith("/checkout") && pathname !== "/checkout/success");

  if (isAdminRoute) {
    if (!session) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { success: false, error: "Admin login required" },
          { status: 401 },
        );
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "admin" && session.role !== "instructor") {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 },
        );
      }
      const dash = request.nextUrl.clone();
      dash.pathname = "/dashboard";
      return NextResponse.redirect(dash);
    }
  }

  if (isProtectedStudent && !session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/cart",
    "/checkout/:path*",
  ],
};
