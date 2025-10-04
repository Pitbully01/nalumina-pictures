import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// === Protected Routes Middleware ===
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Check if user is trying to access protected routes
    const isProtectedRoute = 
      pathname.startsWith('/galleries') && 
      !pathname.match(/^\/galleries\/[^\/]+$/) || // Allow public gallery view
      pathname.includes('/settings');

    // Redirect to home if not authenticated and trying to access protected route
    if (isProtectedRoute && !token) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Always allow access to public routes
        if (pathname === '/' || pathname.startsWith('/api/auth')) {
          return true;
        }

        // Allow public gallery view (but not settings)
        if (pathname.match(/^\/galleries\/[^\/]+$/) && !pathname.includes('/settings')) {
          return true;
        }

        // For protected routes, require authentication
        const isProtectedRoute = 
          pathname === '/galleries' ||
          pathname.includes('/settings');

        return isProtectedRoute ? !!token : true;
      },
    },
  }
);

// === Route Matching Configuration ===
export const config = {
  matcher: [
    '/galleries/:path*',
    '/((?!api/public|api/auth|api/galleries/by-slug|_next/static|_next/image|favicon.ico).*)',
  ],
};
