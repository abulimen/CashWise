import { NextRequest, NextResponse } from 'next/server';
import { insertAiFeedback, insertAuditTrail } from '@/lib/aiStore';
import { getAppUserId } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId?: string;
      query: string;
      aiSuggestion: string;
      userExplanation: string;
      actionType?: 'Chat' | 'Auto-Stash';
      confidence?: number;
    };

    const userId = body.userId || getAppUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId and CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
    }
    const isAccepted = body.userExplanation.toLowerCase().includes('accept');
    const row = await insertAiFeedback({
      user_id: userId,
      query: body.query,
      ai_suggestion: body.aiSuggestion,
      user_explanation: body.userExplanation,
      timestamp: new Date().toISOString(),
    });

    await insertAuditTrail({
      user_id: userId,
      timestamp: row.timestamp,
      action: body.actionType || 'Chat',
      suggestion: body.aiSuggestion,
      user_decision: isAccepted ? 'Accepted' : `Overridden: ${body.userExplanation}`,
      confidence: body.confidence || 0,
    });

    return NextResponse.json({ ok: true, row });
  } catch (error) {
    console.error('feedback insert failed', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
