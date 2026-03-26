import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isPublicPath(pathname: string): boolean {
  return pathname.startsWith('/_next')
    || pathname.startsWith('/api')
    || pathname === '/favicon.ico'
    || pathname === '/login'
    || pathname === '/connect-bank';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const isDocumentNav = request.headers.get('sec-fetch-dest') === 'document';
  if (isDocumentNav) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};
