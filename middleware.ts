import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/me', '/course'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // NOTE: `isLoggedIn` is a plain (non-httpOnly) cookie, set client-side so
    // the UI can read it too — which means it's just a UX signal, not a real
    // security boundary: a visitor can set it in devtools without ever
    // logging in. That's OK *only* because it doesn't grant access on its
    // own — actual protected data still requires the real httpOnly session
    // cookie, and any request without it gets a 401 from the API (handled by
    // apiClient's interceptor). This check just avoids showing a flash of
    // protected UI before that 401 round-trip resolves.
    // For real server-enforced gating here, the backend would need to set
    // `isLoggedIn` (or an equivalent) as httpOnly so only it can write it —
    // that's a backend change, tracked separately.
    const isLoggedIn = request.cookies.get('isLoggedIn');

    if (!isLoggedIn || isLoggedIn.value !== 'true') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/me/:path*', '/course/:path*'],
};
