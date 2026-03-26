import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'cw_auth';
const BANK_COOKIE = 'cw_bank_connected';

function isPublicPath(pathname: string): boolean {
  return pathname.startsWith('/_next')
    || pathname.startsWith('/api')
    || pathname === '/favicon.ico'
    || pathname === '/login'
    || pathname === '/connect-bank';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    const isAuthed = request.cookies.get(AUTH_COOKIE)?.value === '1';
    const isBankConnected = request.cookies.get(BANK_COOKIE)?.value === '1';

    if (pathname === '/login' && isAuthed && isBankConnected) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname === '/connect-bank' && !isAuthed) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const isAuthed = request.cookies.get(AUTH_COOKIE)?.value === '1';
  const isBankConnected = request.cookies.get(BANK_COOKIE)?.value === '1';

  if (!isAuthed) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!isBankConnected) {
    return NextResponse.redirect(new URL('/connect-bank', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};
