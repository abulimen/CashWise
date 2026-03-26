import { NextResponse } from 'next/server';
import { decryptWithDekBase64, unwrapDekForUser } from '@/lib/secureCache';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  const userId = getAppUserId();
  if (!userId) return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });

  const { data } = await getSupabaseAdmin()
    .from('user_onboarding')
    .select('encrypted_profile_blob, wrapped_dek, iv, onboarding_completed, confidence_overall')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data?.encrypted_profile_blob || !data.wrapped_dek || !data.iv) {
    return NextResponse.json({ exists: false });
  }

  const dek = await unwrapDekForUser(userId, data.wrapped_dek);
  const plaintext = await decryptWithDekBase64(data.encrypted_profile_blob, data.iv, dek);

  return NextResponse.json({
    exists: true,
    onboardingCompleted: Boolean(data.onboarding_completed),
    confidenceOverall: Number(data.confidence_overall || 0),
    profileDraft: JSON.parse(plaintext),
  });
}

export async function DELETE() {
  const userId = getAppUserId();
  if (!userId) return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });

  await getSupabaseAdmin().from('user_onboarding').delete().eq('user_id', userId);
  return NextResponse.json({ ok: true });
}
