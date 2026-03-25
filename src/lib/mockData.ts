import { FinancialData, Transaction } from './types';

// Realistic mock data for a Nigerian university student
// Month: March 2026, received ₦30,000 allowance on March 1st

const today = new Date();
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const daysRemaining = Math.max(1, Math.ceil((endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

const mockTransactions: Transaction[] = [
  {
    id: 'txn_001',
    type: 'credit',
    amount: 30000,
    category: 'income',
    date: '2026-03-01T09:00:00Z',
    narration: 'TRF FROM ADEYEMI FUNKE',
    balance: null,
  },
  {
    id: 'txn_002',
    type: 'debit',
    amount: 1500,
    category: 'food',
    date: '2026-03-02T13:30:00Z',
    narration: 'POS PURCHASE - UNILAG CAFETERIA',
    balance: null,
  },
  {
    id: 'txn_003',
    type: 'debit',
    amount: 500,
    category: 'airtime',
    date: '2026-03-03T10:15:00Z',
    narration: 'AIRTIME PURCHASE MTN',
    balance: null,
  },
  {
    id: 'txn_004',
    type: 'debit',
    amount: 2000,
    category: 'transport',
    date: '2026-03-05T08:00:00Z',
    narration: 'UBER TRIP',
    balance: null,
  },
  {
    id: 'txn_005',
    type: 'debit',
    amount: 800,
    category: 'food',
    date: '2026-03-06T17:45:00Z',
    narration: 'POS PURCHASE - SHOPRITE',
    balance: null,
  },
  {
    id: 'txn_006',
    type: 'debit',
    amount: 3500,
    category: 'education',
    date: '2026-03-08T11:00:00Z',
    narration: 'TRANSFER TO COPY CENTER',
    balance: null,
  },
  {
    id: 'txn_007',
    type: 'debit',
    amount: 1200,
    category: 'food',
    date: '2026-03-10T14:00:00Z',
    narration: 'POS PURCHASE - MR BIGGS',
    balance: null,
  },
  {
    id: 'txn_008',
    type: 'debit',
    amount: 1000,
    category: 'airtime',
    date: '2026-03-12T09:30:00Z',
    narration: 'DATA PURCHASE GLO 1.5GB',
    balance: null,
  },
  {
    id: 'txn_009',
    type: 'debit',
    amount: 600,
    category: 'transport',
    date: '2026-03-14T07:30:00Z',
    narration: 'BUS FARE',
    balance: null,
  },
  {
    id: 'txn_010',
    type: 'credit',
    amount: 5000,
    category: 'income',
    date: '2026-03-15T18:00:00Z',
    narration: 'TRF FROM OKAFOR CHIDI',
    balance: null,
  },
  {
    id: 'txn_011',
    type: 'debit',
    amount: 2500,
    category: 'entertainment',
    date: '2026-03-17T19:00:00Z',
    narration: 'FILMHOUSE CINEMAS',
    balance: null,
  },
  {
    id: 'txn_012',
    type: 'debit',
    amount: 900,
    category: 'food',
    date: '2026-03-19T21:00:00Z',
    narration: 'POS PURCHASE - MALLAM SUYA',
    balance: null,
  },
  {
    id: 'txn_013',
    type: 'debit',
    amount: 1500,
    category: 'transport',
    date: '2026-03-21T10:00:00Z',
    narration: 'TRANSPORT',
    balance: null,
  },
  {
    id: 'txn_014',
    type: 'debit',
    amount: 4000,
    category: 'savings',
    date: '2026-03-22T08:00:00Z',
    narration: 'TRF TO PIGGYVEST',
    balance: null,
  },
  {
    id: 'txn_015',
    type: 'debit',
    amount: 1100,
    category: 'food',
    date: '2026-03-24T13:00:00Z',
    narration: 'POS PURCHASE - BUKA',
    balance: null,
  },
];

// Calculate totals
const totalDebits = mockTransactions
  .filter(t => t.type === 'debit' && t.category !== 'savings')
  .reduce((sum, t) => sum + t.amount, 0);

const totalCredits = mockTransactions
  .filter(t => t.type === 'credit')
  .reduce((sum, t) => sum + t.amount, 0);

const totalSaved = mockTransactions
  .filter(t => t.category === 'savings')
  .reduce((sum, t) => sum + t.amount, 0);

const daysSoFar = 24; // Days since March 1
const avgDailySpending = Math.round(totalDebits / daysSoFar);

const balance = totalCredits - totalDebits - totalSaved;

export const mockFinancialData: FinancialData = {
  balance,
  currency: '₦',
  daysRemaining,
  dailyBudget: Math.round(balance / daysRemaining),
  averageDailySpending: avgDailySpending,
  savingsGoal: 50000,
  currentSavings: 16000, // ₦12,000 prior + ₦4,000 this month
  transactions: mockTransactions,
  lastUpdated: new Date().toISOString(),
};

// Helper to format currency
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
