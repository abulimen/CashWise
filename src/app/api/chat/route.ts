import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse, AIRecommendation } from '@/lib/types';
import { parseAmountFromMessage, generateDecision } from '@/lib/decisionEngine';
import { callGemini, buildSystemPrompt } from '@/lib/geminiClient';
import { formatNaira } from '@/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, financialData, conversationHistory } = body;

    // Build context string for the AI
    const financialContext = `
Balance: ${formatNaira(financialData.balance)}
Days remaining this month: ${financialData.daysRemaining}
Daily budget: ${formatNaira(financialData.dailyBudget)}/day
Average daily spending: ${formatNaira(financialData.averageDailySpending)}/day
Savings goal: ${formatNaira(financialData.savingsGoal)}
Current savings: ${formatNaira(financialData.currentSavings)}
Recent transactions: ${financialData.transactions.slice(-5).map(t =>
  `${t.type === 'debit' ? '-' : '+'}${formatNaira(t.amount)} (${t.description})`
).join(', ')}`;

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

    // Try Gemini for natural language response
    let responseMessage = '';
    let geminiRecommendation: AIRecommendation | undefined;

    try {
      const systemPrompt = buildSystemPrompt(financialContext);

      // Build conversation history for Gemini
      const geminiHistory = conversationHistory.slice(-6).map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.content }],
      }));

      const geminiRaw = await callGemini(systemPrompt, message, geminiHistory);

      // Parse Gemini JSON response
      const geminiParsed = JSON.parse(geminiRaw);
      responseMessage = geminiParsed.message || '';
      geminiRecommendation = geminiParsed.recommendation;
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

    // Prefer local recommendation (more reliable math) but use Gemini message
    const finalRecommendation = localRecommendation || geminiRecommendation;

    const response: ChatResponse = {
      message: responseMessage,
      recommendation: finalRecommendation,
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
