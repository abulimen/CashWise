import { NextRequest, NextResponse } from 'next/server';
import { runOnboardingExtraction } from '@/lib/onboarding';
import { insertAuditTrail } from '@/lib/aiStore';
import { getAppUserId } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const userId = getAppUserId();
  if (!userId) return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });

  const body = await request.json() as {
    message: string;
    profileDraft?: Record<string, unknown>;
    questionIndex?: number;
    activeQuestion?: string;
  };
  const result = await runOnboardingExtraction(body.message, body.profileDraft, {
    questionIndex: body.questionIndex,
    activeQuestion: body.activeQuestion,
  });

  const avgConfidence = result.sections.length > 0
    ? Math.round(result.sections.reduce((sum, s) => sum + s.confidence, 0) / result.sections.length)
    : 0;

  await insertAuditTrail({
    user_id: userId,
    timestamp: new Date().toISOString(),
    action: 'Chat',
    suggestion: `Onboarding extraction completed (${result.sections.length} sections).`,
    user_decision: 'Pending',
    confidence: avgConfidence,
  });

  return NextResponse.json(result);
}
