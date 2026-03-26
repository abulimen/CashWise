import { NextResponse } from 'next/server';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';

interface BillRow {
  id: string;
  name: string;
  amount: number | string;
  due_date: string;
  status: string | null;
}

export async function GET() {
  const userId = getAppUserId();
  if (!userId) {
    return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('upcoming_bills')
    .select('id, name, amount, due_date, status')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bills = ((data || []) as BillRow[]).map((bill) => ({
    id: bill.id,
    name: bill.name,
    amount: Number(bill.amount || 0),
    dueDate: bill.due_date,
    status: bill.status || 'pending',
  }));

  return NextResponse.json({ bills });
}
