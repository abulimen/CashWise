import { NextResponse } from 'next/server';
import { FinancialDataResponse } from '@/lib/types';
import { decryptWithDekBase64, encryptWithDekBase64, unwrapDekForUser } from '@/lib/secureCache';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';
import { appendTransactionDelta, loadFinancialData } from '@/lib/financialDataService';

const TWO_MINUTES_MS = 2 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || getAppUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId and CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
  }
  const forceRefresh = url.searchParams.get('force') === 'true';
  const hasConsent = url.searchParams.get('consent') === 'allow';
  const supabase = getSupabaseAdmin();
  const { data: cached } = await supabase
    .from('encrypted_transaction_cache')
    .select('user_id, encrypted_blob, wrapped_dek, iv, last_fetched_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (cached) {
    const dekBase64 = await unwrapDekForUser(userId, cached.wrapped_dek);
    const plaintext = await decryptWithDekBase64(cached.encrypted_blob, cached.iv, dekBase64);
    const cachedData = JSON.parse(plaintext) as FinancialDataResponse['data'];

    const ageMs = Date.now() - new Date(cached.last_fetched_at).getTime();
    const isFresh = ageMs <= TWO_MINUTES_MS;

    if (!forceRefresh && isFresh) {
      return NextResponse.json({
        data: cachedData,
        source: 'mono',
      } satisfies FinancialDataResponse);
    }

    if (!hasConsent) {
      return NextResponse.json(
        { error: 'Consent required before pulling latest transactions.' },
        { status: 403 }
      );
    }

    await appendTransactionDelta(userId);
    const merged = await loadFinancialData(userId);

    const reEncrypted = await encryptWithDekBase64(merged, dekBase64);
    await supabase.from('encrypted_transaction_cache').upsert({
      user_id: userId,
      encrypted_blob: reEncrypted.encryptedBlob,
      iv: reEncrypted.iv,
      wrapped_dek: cached.wrapped_dek,
      last_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      data: merged,
      source: 'mono',
    } satisfies FinancialDataResponse);
  }

  const freshData = await loadFinancialData(userId);
  const response: FinancialDataResponse = {
    data: freshData,
    source: 'mono',
  };
  return NextResponse.json(response);
}
