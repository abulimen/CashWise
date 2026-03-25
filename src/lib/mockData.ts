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
    description: 'Monthly allowance from Mom',
    category: 'income',
    date: '2026-03-01T09:00:00Z',
    narration: 'TRF FROM ADEYEMI FUNKE',
  },
  {
    id: 'txn_002',
    type: 'debit',
    amount: 1500,
    description: 'Lunch at cafeteria',
    category: 'food',
    date: '2026-03-02T13:30:00Z',
    narration: 'POS PURCHASE - UNILAG CAFETERIA',
  },
  {
    id: 'txn_003',
    type: 'debit',
    amount: 500,
    description: 'MTN airtime recharge',
    category: 'airtime',
    date: '2026-03-03T10:15:00Z',
    narration: 'AIRTIME PURCHASE MTN',
  },
  {
    id: 'txn_004',
    type: 'debit',
    amount: 2000,
    description: 'Uber to mainland',
    category: 'transport',
    date: '2026-03-05T08:00:00Z',
    narration: 'UBER TRIP',
  },
  {
    id: 'txn_005',
    type: 'debit',
    amount: 800,
    description: 'Noodles & provisions',
    category: 'food',
    date: '2026-03-06T17:45:00Z',
    narration: 'POS PURCHASE - SHOPRITE',
  },
  {
    id: 'txn_006',
    type: 'debit',
    amount: 3500,
    description: 'Textbook photocopy + printing',
    category: 'education',
    date: '2026-03-08T11:00:00Z',
    narration: 'TRANSFER TO COPY CENTER',
  },
  {
    id: 'txn_007',
    type: 'debit',
    amount: 1200,
    description: 'Lunch with friends',
    category: 'food',
    date: '2026-03-10T14:00:00Z',
    narration: 'POS PURCHASE - MR BIGGS',
  },
  {
    id: 'txn_008',
    type: 'debit',
    amount: 1000,
    description: 'Data subscription',
    category: 'airtime',
    date: '2026-03-12T09:30:00Z',
    narration: 'DATA PURCHASE GLO 1.5GB',
  },
  {
    id: 'txn_009',
    type: 'debit',
    amount: 600,
    description: 'Bus to school',
    category: 'transport',
    date: '2026-03-14T07:30:00Z',
    narration: 'BUS FARE',
  },
  {
    id: 'txn_010',
    type: 'credit',
    amount: 5000,
    description: 'Birthday gift from uncle',
    category: 'income',
    date: '2026-03-15T18:00:00Z',
    narration: 'TRF FROM OKAFOR CHIDI',
  },
  {
    id: 'txn_011',
    type: 'debit',
    amount: 2500,
    description: 'Movie night',
    category: 'entertainment',
    date: '2026-03-17T19:00:00Z',
    narration: 'FILMHOUSE CINEMAS',
  },
  {
    id: 'txn_012',
    type: 'debit',
    amount: 900,
    description: 'Suya & drinks',
    category: 'food',
    date: '2026-03-19T21:00:00Z',
    narration: 'POS PURCHASE - MALLAM SUYA',
  },
  {
    id: 'txn_013',
    type: 'debit',
    amount: 1500,
    description: 'Keke to market',
    category: 'transport',
    date: '2026-03-21T10:00:00Z',
    narration: 'TRANSPORT',
  },
  {
    id: 'txn_014',
    type: 'debit',
    amount: 4000,
    description: 'Saved to PiggyVest',
    category: 'savings',
    date: '2026-03-22T08:00:00Z',
    narration: 'TRF TO PIGGYVEST',
  },
  {
    id: 'txn_015',
    type: 'debit',
    amount: 1100,
    description: 'Jollof rice & chicken',
    category: 'food',
    date: '2026-03-24T13:00:00Z',
    narration: 'POS PURCHASE - BUKA',
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
