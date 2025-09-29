import { NextResponse, NextRequest } from "next/server";

const AUTH_ROUTES = [
  "/patient/dashboard",
  "/hospital/dashboard",
  "/insurer/dashboard",
  "/corporate/dashboard",
  "/dashboard",
]; 

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requiresAuth = AUTH_ROUTES.some((p) => pathname.startsWith(p));
  if (!requiresAuth) return NextResponse.next();

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/(auth)";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/dashboard/:path*",
    "/hospital/dashboard/:path*",
    "/insurer/dashboard/:path*",
    "/corporate/dashboard/:path*",
    "/dashboard/:path*",
  ],
};

