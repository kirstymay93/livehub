import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const user = req.auth?.user;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/creator-dashboard") && user?.role !== "CREATOR") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  if (pathname.startsWith("/dashboard") && !user) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const publicRoutes = ["/", "/login", "/register", "/discover", "/creator", "/stream", "/live"];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (!isPublic && !user) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
