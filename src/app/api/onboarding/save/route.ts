import { NextRequest, NextResponse } from 'next/server';
import { encryptWithDekBase64, generateDekBase64, wrapDekForUser } from '@/lib/secureCache';
import { insertAuditTrail } from '@/lib/aiStore';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const userId = getAppUserId();
  if (!userId) return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });

  const body = await request.json() as {
    profileDraft: Record<string, unknown>;
    confidenceOverall: number;
    accepted: boolean;
    disagreementReason?: string;
  };

  const dek = await generateDekBase64();
  const encrypted = await encryptWithDekBase64(body.profileDraft, dek);
  const wrappedDek = await wrapDekForUser(userId, dek);

  const supabase = getSupabaseAdmin();
  await supabase.from('user_onboarding').upsert({
    user_id: userId,
    consent_given: true,
    encrypted_profile_blob: encrypted.encryptedBlob,
    wrapped_dek: wrappedDek,
    iv: encrypted.iv,
    confidence_overall: body.confidenceOverall,
    onboarding_completed: body.accepted,
    profile_version: 1,
    updated_at: new Date().toISOString(),
  });

  await insertAuditTrail({
    user_id: userId,
    timestamp: new Date().toISOString(),
    action: 'Chat',
    suggestion: 'Onboarding conversation – Profile created with personalized details.',
    user_decision: body.accepted ? 'Accepted' : `Overridden: ${body.disagreementReason || 'No reason provided'}`,
    confidence: body.confidenceOverall,
  });

  return NextResponse.json({ ok: true });
}
