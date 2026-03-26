import { FinancialData, Transaction } from '@/lib/types';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

interface TransactionRow {
  id: string;
  type?: 'credit' | 'debit';
  tx_type?: 'credit' | 'debit';
  amount: string | number;
  narration: string | null;
  balance: string | number | null;
  category: string | null;
  date?: string;
  tx_date?: string;
  description?: string | null;
}

export async function loadFinancialData(userId: string): Promise<FinancialData> {
  const supabase = getSupabaseAdmin();

  const [{ data: goalRows }] = await Promise.all([
    supabase
      .from('savings_goals')
      .select('target_amount, current_amount')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  let txRows: TransactionRow[] = [];

  // Primary: Mono-shaped schema
  const monoQuery = await supabase
    .from('transactions')
    .select('id, type, amount, narration, balance, date, category')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(200);

  if (monoQuery.error) {
    // Fallback: legacy schema compatibility
    const legacyQuery = await supabase
      .from('transactions')
      .select('id, tx_type, amount, narration, category, tx_date, description')
      .eq('user_id', userId)
      .order('tx_date', { ascending: false })
      .limit(200);
    if (legacyQuery.error) {
      throw new Error(legacyQuery.error.message);
    }
    txRows = (legacyQuery.data || []) as TransactionRow[];
  } else {
    txRows = (monoQuery.data || []) as TransactionRow[];
  }

  const transactions: Transaction[] = txRows.map((row) => ({
    id: row.id,
    type: row.type || row.tx_type || 'debit',
    amount: Number(row.amount || 0),
    narration: row.narration || row.description || '',
    balance: row.balance === null ? null : Number(row.balance),
    category: row.category ?? null,
    date: row.date || row.tx_date || new Date().toISOString(),
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
