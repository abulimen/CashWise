import { NextRequest, NextResponse } from 'next/server';
import { wrapDekForUser } from '@/lib/secureCache';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId: string;
      encryptedBlob: string;
      iv: string;
      dekBase64: string;
    };

    const userId = body.userId || getAppUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId and CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
    }
    const wrappedDek = await wrapDekForUser(userId, body.dekBase64);
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from('encrypted_transaction_cache')
      .upsert({
      user_id: userId,
      encrypted_blob: body.encryptedBlob,
      iv: body.iv,
      wrapped_dek: wrappedDek,
      last_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      })
      .select('user_id, last_fetched_at')
      .single();
    if (error || !row) {
      throw new Error(error?.message || 'Failed to upsert cache row');
    }

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
