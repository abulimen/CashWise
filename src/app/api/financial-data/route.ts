import { NextResponse } from 'next/server';
import { mockFinancialData } from '@/lib/mockData';
import { FinancialDataResponse } from '@/lib/types';
import { decryptWithDekBase64, encryptWithDekBase64, unwrapDekForUser } from '@/lib/secureCache';
import { getEncryptedCache, upsertEncryptedCache } from '@/lib/serverStore';

const TWO_MINUTES_MS = 2 * 60 * 1000;

function buildMockDelta() {
  return {
    id: `txn_delta_${Date.now()}`,
    type: 'debit' as const,
    amount: 750,
    description: 'Quick snack',
    category: 'food' as const,
    date: new Date().toISOString(),
    narration: 'POS PURCHASE - CAMPUS KIOSK',
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'demo-user';
  const forceRefresh = url.searchParams.get('force') === 'true';
  const hasConsent = url.searchParams.get('consent') === 'allow';
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
  const cached = getEncryptedCache(userId);

  if (cached) {
    const dekBase64 = await unwrapDekForUser(userId, cached.wrapped_dek);
    const plaintext = await decryptWithDekBase64(cached.encrypted_blob, cached.iv, dekBase64);
    const cachedData = JSON.parse(plaintext) as FinancialDataResponse['data'];

    const ageMs = Date.now() - new Date(cached.last_fetched_at).getTime();
    const isFresh = ageMs <= TWO_MINUTES_MS;

    if (!forceRefresh && isFresh) {
      return NextResponse.json({
        data: cachedData,
        source: useMock ? 'mock' : 'mono',
      } satisfies FinancialDataResponse);
    }

    if (!hasConsent) {
      return NextResponse.json(
        { error: 'Consent required before pulling latest transactions.' },
        { status: 403 }
      );
    }

    const deltaTransaction = buildMockDelta();
    const merged = {
      ...cachedData,
      transactions: [deltaTransaction, ...cachedData.transactions].slice(0, 50),
      lastUpdated: new Date().toISOString(),
    };

    const reEncrypted = await encryptWithDekBase64(merged, dekBase64);
    upsertEncryptedCache({
      user_id: userId,
      encrypted_blob: reEncrypted.encryptedBlob,
      iv: reEncrypted.iv,
      wrapped_dek: cached.wrapped_dek,
      last_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      data: merged,
      source: useMock ? 'mock' : 'mono',
    } satisfies FinancialDataResponse);
  }

  if (useMock) {
    const response: FinancialDataResponse = {
      data: mockFinancialData,
      source: 'mock',
    };
    return NextResponse.json(response);
  }

  // Mono integration placeholder — will be implemented in Phase 3
  // For now, fall back to mock
  const response: FinancialDataResponse = {
    data: mockFinancialData,
    source: 'mock',
  };
  return NextResponse.json(response);
}
