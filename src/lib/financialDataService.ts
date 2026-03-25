import { FinancialData, Transaction } from '@/lib/types';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

interface TransactionRow {
  id: string;
  type: 'credit' | 'debit';
  amount: string | number;
  narration: string | null;
  balance: string | number | null;
  category: string | null;
  date: string;
}

export async function loadFinancialData(userId: string): Promise<FinancialData> {
  const supabase = getSupabaseAdmin();

  const [{ data: txRows }, { data: goalRows }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, type, amount, narration, balance, date, category')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(200),
    supabase
      .from('savings_goals')
      .select('target_amount, current_amount')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const transactions: Transaction[] = ((txRows || []) as TransactionRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount || 0),
    narration: row.narration || '',
    balance: row.balance === null ? null : Number(row.balance),
    category: row.category ?? null,
    date: row.date,
  }));

  const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = Math.max(1, Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const debitRecent = transactions
    .filter((t) => t.type === 'debit')
    .slice(0, 30);
  const averageDailySpending = debitRecent.length > 0
    ? Math.round(debitRecent.reduce((sum, t) => sum + t.amount, 0) / Math.min(30, debitRecent.length || 1))
    : 0;

  const goal = goalRows?.[0];
  const savingsGoal = Number(goal?.target_amount || 0);
  const currentSavings = Number(goal?.current_amount || 0);

  const balance = totalCredits - totalDebits;

  return {
    balance,
    currency: '₦',
    daysRemaining,
    dailyBudget: Math.round(balance / daysRemaining),
    averageDailySpending,
    savingsGoal,
    currentSavings,
    transactions,
    lastUpdated: new Date().toISOString(),
  };
}

export async function appendTransactionDelta(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'debit',
    amount: 750,
    category: null,
    narration: 'POS PURCHASE - CAMPUS KIOSK',
    balance: null,
    date: new Date().toISOString(),
  });
}
