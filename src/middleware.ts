import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute, getDefaultDashboard, normalizeRole } from "./lib/permissions";

// Define public routes that do not require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/manifest.json",
  "/favicon.ico",
  "/robots.txt",
];

// Helper to safely decode JWT payload in Edge runtime without Node crypto dependencies
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    // Check token expiration if exp is set
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, Next.js internal requests, and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // images, icons, etc.
  ) {
    return NextResponse.next();
  }

  // Check for public paths
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/login")
  );

  const token = req.cookies.get("hms_auth_token")?.value;
  const user = token ? decodeJwtPayload(token) : null;

  // If page is public (e.g. landing page or login)
  if (isPublicPath) {
    // Only auto-redirect away from /login if logged in and not explicitly navigating with query params
    if (pathname === "/login" && user && user.role && !req.nextUrl.searchParams.get("redirect")) {
      const defaultDash = getDefaultDashboard(user.role);
      return NextResponse.redirect(new URL(defaultDash, req.url));
    }
    return NextResponse.next();
  }

  // If unauthenticated and trying to access a protected page, redirect to login
  if (!user || !user.role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      // Clear stale/invalid cookie
      response.cookies.set("hms_auth_token", "", { maxAge: 0, path: "/" });
    }
    return response;
  }

  const standardRole = normalizeRole(user.role);

  // Check if current user role has permission to access this route
  const isAllowed = canAccessRoute(standardRole, pathname);

  if (!isAllowed) {
    // If not allowed, redirect to their default dashboard
    const defaultDash = getDefaultDashboard(standardRole);
    // Prevent redirect loop if default dashboard itself wasn't allowed for some reason
    if (pathname !== defaultDash) {
      return NextResponse.redirect(new URL(defaultDash, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
