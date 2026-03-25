import { NextRequest, NextResponse } from 'next/server';
import { exchangeToken } from '@/lib/monoClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing auth code' }, { status: 400 });
    }

    // Exchange the Mono auth code for an account ID
    const result = await exchangeToken(code);

    // In production: store result.id (the account ID) in a session/database
    // For the hackathon demo, we just return it to the frontend
    return NextResponse.json({
      accountId: result.id,
      message: 'Account linked successfully',
    });
  } catch (error) {
    console.error('Mono callback error:', error);
    return NextResponse.json(
      { error: 'Failed to link account' },
      { status: 500 }
    );
  }
}
