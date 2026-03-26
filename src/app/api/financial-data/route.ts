import { NextResponse } from 'next/server';
import { FinancialDataResponse } from '@/lib/types';
import { decryptWithDekBase64, encryptWithDekBase64, generateDekBase64, unwrapDekForUser, wrapDekForUser } from '@/lib/secureCache';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';
import { loadFinancialData } from '@/lib/financialDataService';

const TWO_MINUTES_MS = 2 * 60 * 1000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

function isCachePayloadInconsistent(payload: FinancialDataResponse['data']): boolean {
  // Guard against stale/empty cache payloads: always re-hydrate from DB when no ledger rows are present.
  if (payload.transactions.length === 0) {
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  try {
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
      let dekBase64 = '';
      let cachedData: FinancialDataResponse['data'] | null = null;

      // Never let cache decrypt issues crash the endpoint; just fall back to DB.
      try {
        dekBase64 = await unwrapDekForUser(userId, cached.wrapped_dek);
        const plaintext = await decryptWithDekBase64(cached.encrypted_blob, cached.iv, dekBase64);
        cachedData = JSON.parse(plaintext) as FinancialDataResponse['data'];
      } catch {
        cachedData = null;
      }

      if (cachedData) {
        const cacheInconsistent = isCachePayloadInconsistent(cachedData);
        const ageMs = Date.now() - new Date(cached.last_fetched_at).getTime();
        const isFresh = ageMs <= TWO_MINUTES_MS;

        if (!forceRefresh && isFresh && !cacheInconsistent) {
          return NextResponse.json({
            data: cachedData,
            source: 'mono',
          } satisfies FinancialDataResponse);
        }

        if (!hasConsent && !cacheInconsistent) {
          return NextResponse.json(
            { error: 'Consent required before pulling latest transactions.' },
            { status: 403 }
          );
        }
      }

      const merged = await loadFinancialData(userId);

      let wrappedDekToUse = cached.wrapped_dek;
      if (!dekBase64) {
        try {
          dekBase64 = await unwrapDekForUser(userId, cached.wrapped_dek);
        } catch {
          // Cache key unwrap failed (likely stale/invalid wrapped key). Self-heal with a new DEK.
          dekBase64 = await generateDekBase64();
          wrappedDekToUse = await wrapDekForUser(userId, dekBase64);
        }
      }

      const reEncrypted = await encryptWithDekBase64(merged, dekBase64);
      await supabase.from('encrypted_transaction_cache').upsert({
        user_id: userId,
        encrypted_blob: reEncrypted.encryptedBlob,
        iv: reEncrypted.iv,
        wrapped_dek: wrappedDekToUse,
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
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load financial data: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
