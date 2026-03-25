import { NextRequest, NextResponse } from 'next/server';
import { FinancialData } from '@/lib/types';
import { buildRetrievalContext, generateJudgedAdvice } from '@/lib/trustPipeline';
import { insertAuditTrail, listRecentAiFeedback } from '@/lib/serverStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      incomingAmount: number;
      suggestedSavings: number;
      financialData: FinancialData;
    };

    const { incomingAmount, suggestedSavings, financialData } = body;
    const retrievalContext = buildRetrievalContext({
      userId: 'demo-user',
      financialData,
      upcomingBills: [
        { id: 'bill_data', name: 'Monthly data plan', amount: 3000, dueDate: new Date(Date.now() + (1000 * 60 * 60 * 24 * 6)).toISOString() },
      ],
      savingsGoals: [
        { id: 'goal_main', title: 'Emergency cushion', targetAmount: financialData.savingsGoal, currentAmount: financialData.currentSavings },
      ],
      recentFeedback: listRecentAiFeedback('demo-user', 5),
    });

    const prompt = `You are reviewing an Auto-Stash proposal. Incoming cash: ₦${incomingAmount.toLocaleString('en-NG')}. Proposed stash: ₦${suggestedSavings.toLocaleString('en-NG')}. Should the user accept? Start with yes/no and cite data.`;

    const judged = await generateJudgedAdvice({
      userQuery: prompt,
      retrievalContext,
      conversationHistory: [],
    });

    insertAuditTrail({
      user_id: 'demo-user',
      timestamp: new Date().toISOString(),
      action: 'Auto-Stash',
      suggestion: judged.finalResponse,
      user_decision: 'Pending',
      confidence: judged.confidenceScore,
    });

    return NextResponse.json({
      message: `${judged.finalResponse}\n\nConfidence score: ${judged.confidenceScore}/100`,
      confidenceScore: judged.confidenceScore,
      citations: judged.citations,
      reasoningTrace: judged.reasoningTrace,
      usedPromptSnippet: judged.usedPromptSnippet,
      adviceMeta: {
        actionType: 'Auto-Stash',
        suggestion: judged.finalResponse,
      },
    });
    
  } catch (error) {
    console.error('Auto-Stash advice error:', error);
    return NextResponse.json({ error: 'Unable to generate Auto-Stash advice' }, { status: 500 });
  }
}
