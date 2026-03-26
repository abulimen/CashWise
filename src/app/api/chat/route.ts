import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse, AIRecommendation, DataCitation, PendingProfileUpdate } from '@/lib/types';
import { parseAmountFromMessage, generateDecision } from '@/lib/decisionEngine';
import { buildRetrievalContext, generateJudgedAdvice } from '@/lib/trustPipeline';
import { insertAuditTrail, listRecentAiFeedback } from '@/lib/aiStore';
import { getAppUserId, getSupabaseAdmin } from '@/lib/supabaseServer';
import { deepMergeProfile, loadOnboardingProfile, saveOnboardingProfile } from '@/lib/onboardingStore';
import { proposeProfileUpdateFromChat } from '@/lib/onboarding';

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

function encodeUpdateToken(payload: { patch: Record<string, unknown>; summary: string; confidence: number }): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeUpdateToken(token: string): { patch: Record<string, unknown>; summary: string; confidence: number } | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      patch?: Record<string, unknown>;
      summary?: string;
      confidence?: number;
    };
    if (!parsed.patch || typeof parsed.patch !== 'object') return null;
    return {
      patch: parsed.patch,
      summary: String(parsed.summary || 'Profile updated'),
      confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence || 0)))),
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, financialData, conversationHistory } = body;
    const userId = getAppUserId();
    if (!userId) {
      return NextResponse.json({ message: 'CASHWISE_DEMO_USER_ID is not set.' }, { status: 400 });
    }

    const confirmMatch = message.match(/^\/confirm-profile-update\s+(.+)$/i);
    if (confirmMatch?.[1]) {
      const decoded = decodeUpdateToken(confirmMatch[1].trim());
      if (!decoded) {
        return NextResponse.json({ message: 'I could not validate that profile update token. Please request the update again.' } satisfies ChatResponse);
      }
      const existing = await loadOnboardingProfile(userId);
      const mergedProfile = deepMergeProfile(existing.profileDraft, decoded.patch);
      await saveOnboardingProfile({
        userId,
        profileDraft: mergedProfile,
        confidenceOverall: Math.max(existing.confidenceOverall, decoded.confidence),
        onboardingCompleted: existing.onboardingCompleted,
      });
      const confirmation = `Done. I saved that preference update to your profile.\n\nUpdated profile area: ${decoded.summary}`;
      await insertAuditTrail({
        user_id: userId,
        timestamp: new Date().toISOString(),
        action: 'Chat',
        suggestion: confirmation,
        user_decision: 'Accepted',
        confidence: decoded.confidence,
      });
      return NextResponse.json({
        message: confirmation,
        confidenceScore: decoded.confidence,
        adviceMeta: { actionType: 'Chat', suggestion: confirmation, decision: 'Accepted' },
      } satisfies ChatResponse);
    }

    const profileForUpdate = await loadOnboardingProfile(userId);
    const updateDraft = await proposeProfileUpdateFromChat({
      userMessage: message,
      currentProfile: profileForUpdate.profileDraft,
    });
    if (updateDraft.isUpdateCommand) {
      if (updateDraft.followUpQuestion) {
        return NextResponse.json({
          message: `I can update your profile, but I need one clarification first: ${updateDraft.followUpQuestion}`,
          confidenceScore: updateDraft.confidence,
          adviceMeta: {
            actionType: 'Chat',
            suggestion: 'Profile edit requested, clarification needed.',
          },
        } satisfies ChatResponse);
      }
      if (Object.keys(updateDraft.patch).length === 0) {
        return NextResponse.json({
          message: "I heard a profile edit request, but I couldn't extract an exact value to save. Please rephrase like: \"Update my Spotify to ₦1,500 monthly.\"",
          confidenceScore: updateDraft.confidence,
        } satisfies ChatResponse);
      }
      const pendingProfileUpdate: PendingProfileUpdate = {
        token: encodeUpdateToken({
          patch: updateDraft.patch,
          summary: updateDraft.summary,
          confidence: updateDraft.confidence,
        }),
        summary: updateDraft.summary,
        confidence: updateDraft.confidence,
      };
      return NextResponse.json({
        message: `Proposed profile update: ${updateDraft.summary}\n\nPlease confirm before I save this.`,
        confidenceScore: updateDraft.confidence,
        pendingProfileUpdate,
        adviceMeta: {
          actionType: 'Chat',
          suggestion: `Pending profile update: ${updateDraft.summary}`,
        },
      } satisfies ChatResponse);
    }

    // Try to parse a purchase amount from the message
    const parsed = parseAmountFromMessage(message);

    // First, generate local decision engine recommendation (always works)
    let localRecommendation: AIRecommendation | undefined;
    if (parsed) {
      localRecommendation = generateDecision({
        amount: parsed.amount,
        description: parsed.description,
        financialData,
      });
    }

    // Run grounded AI generation + strict judge correction
    let responseMessage = '';
    let confidenceScore = 0;
    let citations: DataCitation[] = [];
    let reasoningTrace = '';
    let usedPromptSnippet = '';

    try {
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

      const judged = await generateJudgedAdvice({
        userQuery: message,
        retrievalContext,
        conversationHistory,
      });

      responseMessage = `${judged.finalResponse}\n\nConfidence score: ${judged.confidenceScore}/100`;
      confidenceScore = judged.confidenceScore;
      citations = judged.citations;
      reasoningTrace = judged.reasoningTrace;
      usedPromptSnippet = judged.usedPromptSnippet;
    } catch (geminiError) {
      console.warn('Gemini failed, using local decision engine:', geminiError);
      // Fall back to local-generated message
      if (localRecommendation) {
        const verdict = localRecommendation.verdict;
        responseMessage = verdict === 'yes'
          ? `Looking at your finances, you can comfortably afford this. Here's the breakdown:`
          : verdict === 'caution'
            ? `Let me walk you through this one — it's doable but tight. Here's what I found:`
            : `I'd hold off on this one. Here's why:`;
      } else {
        responseMessage = `I can help you with spending decisions! Try asking something like "Can I afford ₦12,000 headphones?" and I'll show you exactly how it affects your budget.`;
      }
    }

    const finalRecommendation = localRecommendation;

    const response: ChatResponse = {
      message: responseMessage,
      recommendation: finalRecommendation,
      confidenceScore,
      citations,
      reasoningTrace,
      usedPromptSnippet,
      adviceMeta: {
        actionType: 'Chat',
        suggestion: responseMessage,
      },
    };

    await insertAuditTrail({
      user_id: userId,
      timestamp: new Date().toISOString(),
      action: 'Chat',
      suggestion: responseMessage,
      user_decision: 'Pending',
      confidence: confidenceScore,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", recommendation: undefined },
      { status: 500 }
    );
  }
}
