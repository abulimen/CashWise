import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse, AIRecommendation } from '@/lib/types';
import { parseAmountFromMessage, generateDecision } from '@/lib/decisionEngine';
import { buildRetrievalContext, generateJudgedAdvice } from '@/lib/trustPipeline';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, financialData, conversationHistory } = body;

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
    let citations = [];
    let reasoningTrace = '';
    let usedPromptSnippet = '';

    try {
      const retrievalContext = buildRetrievalContext({
        userId: 'demo-user',
        financialData,
        upcomingBills: [
          { id: 'bill_hostel', name: 'Hostel contribution', amount: 5000, dueDate: new Date(Date.now() + (1000 * 60 * 60 * 24 * 11)).toISOString() },
        ],
        savingsGoals: [
          { id: 'goal_main', title: 'Emergency cushion', targetAmount: financialData.savingsGoal, currentAmount: financialData.currentSavings },
        ],
      });

      const judged = await generateJudgedAdvice({
        userQuery: message,
        retrievalContext,
        conversationHistory,
      });

      responseMessage = judged.finalResponse;
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again.", recommendation: undefined },
      { status: 500 }
    );
  }
}
