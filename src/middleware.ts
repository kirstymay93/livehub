import { withAuth } from 'next-auth/middleware';
import { NextRequest } from 'next/server';

export const middleware = withAuth(
  function middleware(req: NextRequest & { nextauth: any }) {
    const { token } = req.nextauth;
    const pathname = req.nextUrl.pathname;

    // Protect creator dashboard
    if (pathname.startsWith('/creator-dashboard')) {
      if (!token || (token.role as string) !== 'CREATOR') {
        return new Response('Unauthorized', { status: 403 });
      }
    }

    // Protect admin dashboard
    if (pathname.startsWith('/admin')) {
      if (!token || (token.role as string) !== 'ADMIN') {
        return new Response('Unauthorized', { status: 403 });
      }
    }

    // Protect dashboard
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return new Response('Unauthorized', { status: 403 });
      }
    }

    return undefined;
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes
        const publicRoutes = ['/', '/login', '/register', '/discover', '/creator', '/stream', '/live'];
        const isPublic = publicRoutes.some(route => pathname.startsWith(route));

        if (isPublic) return true;

        // Protected routes require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
