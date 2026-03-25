import { NextResponse } from 'next/server';
import { listAuditTrailForWeek } from '@/lib/aiStore';
import { getAppUserId } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || getAppUserId();
  if (!userId) {
    return NextResponse.json({ rows: [], error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
  }
  const rows = await listAuditTrailForWeek(userId);
  return NextResponse.json({ rows });
}
