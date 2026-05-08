import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-auth";

const ADMIN_PREFIX = "/admin";
const PUBLIC_ADMIN_PATHS = new Set<string>(["/admin/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next();
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return redirectToLogin(request);

  const result = await verifyAdminSession(token);
  if (!result.valid) {
    const res = redirectToLogin(request);
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  if (request.nextUrl.pathname !== "/admin") {
    url.searchParams.set("from", request.nextUrl.pathname);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
