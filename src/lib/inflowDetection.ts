import { FinancialData } from '@/lib/types';

const DEFAULT_BULK_INFLOW_MIN_NAIRA = 10000;
const NEW_INFLOW_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface InflowDetectionResult {
  detected: boolean;
  incomingAmount: number;
  txDate?: string;
}

export function detectNewBulkInflow(data: FinancialData, bulkInflowMinNaira = DEFAULT_BULK_INFLOW_MIN_NAIRA): InflowDetectionResult {
  const cutoff = Date.now() - NEW_INFLOW_WINDOW_MS;
  const candidates = [...data.transactions]
    .filter((tx) =>
      tx.type === 'credit' &&
      tx.amount >= bulkInflowMinNaira &&
      new Date(tx.date).getTime() >= cutoff
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latest = candidates[0];
  if (!latest) {
    return { detected: false, incomingAmount: 0 };
  }

  return {
    detected: true,
    incomingAmount: latest.amount,
    txDate: latest.date,
  };
}
