import { NextResponse, NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/patient",
  "/hospital",
  "/insurer",
  "/corporate",
  "/dashboard",
];

const PUBLIC_PATHS = [
  "/login",
  "/explore",
  "/onboard-corporate",
  "/onboard-insurer",
  "/onboard-hospital",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const requiresAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!requiresAuth) return NextResponse.next();

  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/hospital/:path*",
    "/insurer/:path*",
    "/corporate/:path*",
    "/dashboard/:path*",
  ],
};

