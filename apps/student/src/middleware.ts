import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';

// Define the paths that are considered public (accessible without authentication)
const publicPaths = ['/']; 

// Define the paths related to authentication
const authPaths = ['/'];

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.includes(pathname);
  const isAuthPath = authPaths.includes(pathname);
  
  // If the user is authenticated
  if (session) {
    // If they try to access an authentication page (like login), redirect to dashboard
    if (isAuthPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  // If the user is not authenticated
  else {
    // If they try to access a protected path, redirect to the login page
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If none of the above conditions are met, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 