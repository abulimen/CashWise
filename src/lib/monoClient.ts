/**
 * Mono Open Banking API client.
 * Uses test keys — toggle NEXT_PUBLIC_USE_MOCK_DATA=false to activate.
 */

const MONO_BASE_URL = 'https://api.withmono.com';

function getMonoHeaders() {
  return {
    'Content-Type': 'application/json',
    'mono-sec-key': process.env.MONO_SECRET_KEY || '',
  };
}

async function monoFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${MONO_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getMonoHeaders(),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mono API error ${response.status}: ${error}`);
  }

  return response.json();
}

// --- Auth ---

export async function exchangeToken(code: string): Promise<{ id: string }> {
  return monoFetch('/v1/account/auth', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// --- Account Data ---

export async function getAccountBalance(accountId: string): Promise<{
  balance: number;
  currency: string;
}> {
  return monoFetch(`/v1/accounts/${accountId}/balance`);
}

export async function getAccountDetails(accountId: string): Promise<{
  account: {
    id: string;
    name: string;
    accountNumber: string;
    type: string;
    balance: number;
    currency: string;
    institution: { name: string };
  };
}> {
  return monoFetch(`/v1/accounts/${accountId}`);
}

export async function getTransactions(
  accountId: string,
  options?: { period?: string; limit?: number }
): Promise<{
  data: Array<{
    id: string;
    amount: number;
    date: string;
    narration: string;
    type: 'debit' | 'credit';
    balance: number;
    category: string;
  }>;
  paging: { total: number; page: number; previous: string; next: string };
}> {
  const params = new URLSearchParams();
  if (options?.period) params.set('period', options.period);
  if (options?.limit) params.set('limit', options.limit.toString());

  return monoFetch(`/v1/accounts/${accountId}/transactions?${params}`);
}

export async function getIncome(accountId: string): Promise<{
  type: string;
  amount: number;
  employer?: string;
}> {
  return monoFetch(`/v1/accounts/${accountId}/income`);
}

// --- Mono Connect (frontend) ---

export function getMonoConnectPublicKey(): string {
  return process.env.MONO_PUBLIC_KEY || '';
}
