import { NextRequest, NextResponse } from 'next/server';
import { upsertEncryptedCache } from '@/lib/serverStore';
import { wrapDekForUser } from '@/lib/secureCache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId: string;
      encryptedBlob: string;
      iv: string;
      dekBase64: string;
    };

    const userId = body.userId || 'demo-user';
    const wrappedDek = await wrapDekForUser(userId, body.dekBase64);

    const row = upsertEncryptedCache({
      user_id: userId,
      encrypted_blob: body.encryptedBlob,
      iv: body.iv,
      wrapped_dek: wrappedDek,
      last_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      userId: row.user_id,
      lastFetchedAt: row.last_fetched_at,
    });
  } catch (error) {
    console.error('cache init error', error);
    return NextResponse.json({ error: 'Failed to initialize encrypted cache.' }, { status: 500 });
  }
}
