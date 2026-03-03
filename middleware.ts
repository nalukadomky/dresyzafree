import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware that rewrites clean team URLs (e.g. /sokol-lustenice)
 * to the internal /t/[slug] route, so teams get pretty URLs without /t/ prefix.
 *
 * All known app routes are excluded from rewriting.
 */

const RESERVED_PREFIXES = [
  'admin',
  'api',
  'dashboard',
  'login',
  'register',
  't',
  'udalost',
  '_next',
  'favicon.ico',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip root
  if (pathname === '/') return NextResponse.next();

  // Get the first path segment (e.g. "/sokol-lustenice" → "sokol-lustenice")
  const firstSegment = pathname.split('/')[1];

  // Skip reserved routes and static files (check full path for extensions)
  if (
    RESERVED_PREFIXES.includes(firstSegment) ||
    /\.\w+$/.test(pathname) // static files like .png, .js, .css (also in subdirs)
  ) {
    return NextResponse.next();
  }

  // Rewrite to /t/[slug] internally
  const url = request.nextUrl.clone();
  url.pathname = `/t/${firstSegment}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Match all paths except _next/static, _next/image, and files with extensions
    '/((?!_next/static|_next/image).*)',
  ],
};
