import { NextRequest, NextResponse } from 'next/server';
import { FinancialData } from '@/lib/types';
import { buildRetrievalContext, generateJudgedAdvice } from '@/lib/trustPipeline';
import { insertAuditTrail, listRecentAiFeedback } from '@/lib/aiStore';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';
import { detectNewBulkInflow } from '@/lib/inflowDetection';

interface BillRow {
  id: string;
  name: string;
  amount: number | string;
  due_date: string;
}

interface GoalRow {
  id: string;
  title: string;
  target_amount: number | string;
  current_amount: number | string;
  due_date: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      incomingAmount: number;
      suggestedSavings: number;
      financialData: FinancialData;
    };
    const userId = getAppUserId();
    if (!userId) {
      return NextResponse.json({ error: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
    }

    const { financialData } = body;
    const { data: profileData } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('bulk_inflow_min_amount')
      .eq('user_id', userId)
      .maybeSingle();
    const bulkMin = Number(profileData?.bulk_inflow_min_amount || 10000);
    const inflow = detectNewBulkInflow(financialData, bulkMin);
    const incomingAmount = inflow.incomingAmount;
    const suggestedSavings = incomingAmount > 0 ? Math.max(0, Math.round(incomingAmount * 0.3)) : 0;

    if (!inflow.detected) {
      return NextResponse.json({
        message: 'No new bulk income inflow detected recently. Auto-Stash suggestion suppressed.',
        shouldSuggest: false,
        confidenceScore: 0,
        citations: [],
        reasoningTrace: `No recent credit >= ₦${bulkMin.toLocaleString('en-NG')} detected in the last 24 hours.`,
        usedPromptSnippet: 'Never make up numbers or transactions.',
        adviceMeta: {
          actionType: 'Auto-Stash',
          suggestion: 'Suppressed: no new bulk inflow detected.',
        },
      });
    }
    const supabase = getSupabaseAdmin();
    const [{ data: bills }, { data: goals }, feedback] = await Promise.all([
      supabase.from('upcoming_bills').select('id, name, amount, due_date').eq('user_id', userId).eq('status', 'pending').order('due_date', { ascending: true }).limit(10),
      supabase.from('savings_goals').select('id, title, target_amount, current_amount, due_date').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(5),
      listRecentAiFeedback(userId, 5),
    ]);
    const retrievalContext = buildRetrievalContext({
      userId,
      financialData,
      upcomingBills: ((bills || []) as BillRow[]).map((bill) => ({
        id: bill.id,
        name: bill.name,
        amount: Number(bill.amount || 0),
        dueDate: new Date(bill.due_date).toISOString(),
      })),
      savingsGoals: ((goals || []) as GoalRow[]).map((goal) => ({
        id: goal.id,
        title: goal.title,
        targetAmount: Number(goal.target_amount || 0),
        currentAmount: Number(goal.current_amount || 0),
        dueDate: goal.due_date ? new Date(goal.due_date).toISOString() : undefined,
      })),
      recentFeedback: feedback,
    });

    const prompt = `You are reviewing an Auto-Stash proposal. Incoming cash: ₦${incomingAmount.toLocaleString('en-NG')}. Proposed stash: ₦${suggestedSavings.toLocaleString('en-NG')}. Should the user accept? Start with yes/no and cite data.`;

    const judged = await generateJudgedAdvice({
      userQuery: prompt,
      retrievalContext,
      conversationHistory: [],
    });

    const normalized = judged.finalResponse.toLowerCase();
    const startsWithYes = normalized.startsWith('yes');
    const hasUncertainSignal =
      normalized.includes("don't have enough info") ||
      normalized.includes('cannot verify') ||
      normalized.includes('cannot recommend') ||
      normalized.includes('not enough info');
    const shouldSuggest = inflow.detected && startsWithYes && !hasUncertainSignal && judged.confidenceScore >= 70;

    try {
      await insertAuditTrail({
        user_id: userId,
        timestamp: new Date().toISOString(),
        action: 'Auto-Stash',
        suggestion: judged.finalResponse,
        user_decision: 'Pending',
        confidence: judged.confidenceScore,
      });
    } catch (auditError) {
      // Audit logging should never block user-facing advice.
      console.warn('Auto-Stash audit logging failed:', auditError);
    }

    return NextResponse.json({
      message: `${judged.finalResponse}\n\nConfidence score: ${judged.confidenceScore}/100`,
      shouldSuggest,
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
