import { NextRequest, NextResponse } from 'next/server';
import { insertAiFeedback, insertAuditTrail } from '@/lib/serverStore';

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

    const userId = body.userId || 'demo-user';
    const isAccepted = body.userExplanation.toLowerCase().includes('accept');
    const row = insertAiFeedback({
      user_id: userId,
      query: body.query,
      ai_suggestion: body.aiSuggestion,
      user_explanation: body.userExplanation,
      timestamp: new Date().toISOString(),
    });

    insertAuditTrail({
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
