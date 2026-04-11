import { NextRequest, NextResponse } from "next/server";

// Session cookie name must match lib/auth.ts cookieName
const SESSION_COOKIE = "p2p-session";

// Paths that require authentication and should redirect with a ?next= return URL
const PROTECTED_PATTERNS = [/^\/requests\/[^/]+/];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname));
  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();

  // Redirect unauthenticated user to login with return path
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/requests/:id*"],
};
