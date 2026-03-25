import { NextRequest, NextResponse } from 'next/server';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  const userId = getAppUserId();
  if (!userId) {
    return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('bulk_inflow_min_amount')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (error.message.includes('bulk_inflow_min_amount')) {
      return NextResponse.json({ bulkInflowMinAmount: 10000 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    bulkInflowMinAmount: Number(data?.bulk_inflow_min_amount || 10000),
  });
}

export async function PATCH(request: NextRequest) {
  const userId = getAppUserId();
  if (!userId) {
    return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
  }

  const body = await request.json() as { bulkInflowMinAmount?: number };
  const value = Number(body.bulkInflowMinAmount || 10000);
  const safeValue = Number.isFinite(value) && value > 0 ? Math.round(value) : 10000;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      bulk_inflow_min_amount: safeValue,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    if (error.message.includes('bulk_inflow_min_amount')) {
      return NextResponse.json({
        error: 'Schema update required: add user_profiles.bulk_inflow_min_amount column in Supabase SQL Editor.',
      }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bulkInflowMinAmount: safeValue });
}
