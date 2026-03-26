import { NextRequest, NextResponse } from 'next/server';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';

const CONSENT_TEXT = "To give you accurate advice, I'll ask about your income, expenses, goals, and habits. This info stays encrypted and is only used for your profile. You can delete or update anything anytime.";

export async function GET() {
  const userId = getAppUserId();
  if (!userId) return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });

  const { data } = await getSupabaseAdmin()
    .from('user_onboarding')
    .select('consent_given, onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({
    consentText: CONSENT_TEXT,
    consentGiven: Boolean(data?.consent_given),
    onboardingCompleted: Boolean(data?.onboarding_completed),
  });
}

export async function POST(request: NextRequest) {
  const userId = getAppUserId();
  if (!userId) return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
  const body = await request.json() as { consentGiven: boolean };

  await getSupabaseAdmin().from('user_onboarding').upsert({
    user_id: userId,
    consent_given: Boolean(body.consentGiven),
    consent_text: CONSENT_TEXT,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
