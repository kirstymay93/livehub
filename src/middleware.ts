import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

function loginRedirect(req: NextRequest) {
  const url = new URL("/login", req.url);
  url.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export default auth((req) => {
  const user = req.auth?.user;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/creator-dashboard") && !user) {
    return loginRedirect(req);
  }

  if (pathname.startsWith("/creator-dashboard") && user?.role !== "CREATOR") {
    return NextResponse.redirect(new URL("/?message=Creator access required", req.url));
  }

  if (pathname.startsWith("/admin") && !user) {
    return loginRedirect(req);
  }

  if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/?message=Administrator access required", req.url));
  }

  if (pathname.startsWith("/dashboard") && !user) {
    return loginRedirect(req);
  }

  const publicRoutes = ["/", "/login", "/register", "/discover", "/creator", "/stream", "/live"];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (!isPublic && !user) {
    return loginRedirect(req);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
