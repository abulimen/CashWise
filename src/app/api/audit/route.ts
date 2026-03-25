import { NextResponse } from 'next/server';
import { listAuditTrailForWeek } from '@/lib/serverStore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'demo-user';
  const rows = listAuditTrailForWeek(userId);
  return NextResponse.json({ rows });
}
