import { NextResponse, type NextRequest } from "next/server";
import { getAccessTokenCookieName, verifySessionToken } from "@/lib/auth/session";
import type { AppRole } from "@/lib/auth/types";

const roleAccessMap: Record<string, AppRole[]> = {
  "/admin": ["SUPER_ADMIN", "RECEPTION"],
  "/doctor": ["DOCTOR", "SUPER_ADMIN"],
  "/patient": ["PATIENT"]
};

const getProtectedRule = (pathname: string): [string, AppRole[]] | undefined => {
  return Object.entries(roleAccessMap).find(([prefix]) => pathname.startsWith(prefix));
};

export async function middleware(request: NextRequest) {
  const protectedRule = getProtectedRule(request.nextUrl.pathname);

  if (!protectedRule) {
    return NextResponse.next();
  }

  const [prefix, allowedRoles] = protectedRule;
  const token = request.cookies.get(getAccessTokenCookieName())?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = await verifySessionToken(token);

    if (!allowedRoles.includes(session.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-authenticated-route", prefix);
    return response;
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/patient/:path*"]
};
