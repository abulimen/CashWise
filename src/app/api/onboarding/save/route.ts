import { NextRequest, NextResponse } from 'next/server';
import { insertAuditTrail } from '@/lib/aiStore';
import { saveOnboardingProfile } from '@/lib/onboardingStore';
import { getAppUserId } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const userId = getAppUserId();
  if (!userId) return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });

  const body = await request.json() as {
    profileDraft: Record<string, unknown>;
    confidenceOverall: number;
    accepted: boolean;
    disagreementReason?: string;
  };

  if (body.accepted) {
    await saveOnboardingProfile({
      userId,
      profileDraft: body.profileDraft,
      confidenceOverall: body.confidenceOverall,
      onboardingCompleted: true,
    });
  }

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
