import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({ consent: false }));
  if (!body?.consent) {
    return NextResponse.json({ error: 'Consent required.' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('cw_bank_connected', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
