/**
 * Gemini API Client with key rotation.
 * Rotates through multiple API keys to avoid rate limits.
 */

let keyIndex = 0;

function getNextApiKey(): string {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
  if (keys.length === 0) {
    throw new Error('No Gemini API keys configured. Set GEMINI_API_KEYS in .env.local');
  }
  const key = keys[keyIndex % keys.length];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface GeminiCallOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
  maxOutputTokens?: number;
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: GeminiMessage[] = [],
  options: GeminiCallOptions = {},
  _retriesLeft?: number
): Promise<string> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
  // Allow one full rotation through all keys before giving up
  const retriesLeft = _retriesLeft ?? keys.length;

  if (retriesLeft <= 0) {
    throw new Error('All Gemini API keys are rate-limited. Falling back to local engine.');
  }

  const apiKey = getNextApiKey();
  const model = options.model || 'gemini-3.1-flash-lite-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents: GeminiMessage[] = [
    ...conversationHistory,
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.1,
      topP: options.topP ?? 0.9,
      maxOutputTokens: options.maxOutputTokens ?? 1500,
      responseMimeType: options.responseMimeType ?? 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      console.warn(`Gemini key rate-limited. ${retriesLeft - 1} retries left.`);
      return callGemini(systemPrompt, userMessage, conversationHistory, options, retriesLeft - 1);
    }
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text;
}

/**
 * System prompt for the CashWise financial copilot.
 * Forces structured JSON output with reasoning.
 */
export function buildSystemPrompt(financialContext: string): string {
  return `You are CashWise, an AI financial copilot for Nigerian university students.

Your job is to help students make financial decisions they can TRUST by being completely transparent.

FINANCIAL CONTEXT:
${financialContext}

RULES:
1. Always ground your advice in the user's ACTUAL financial data
2. Never make up numbers — use only the data provided
3. Be clear about what you checked and what you concluded
4. If you're uncertain, say so — don't fake confidence
5. Use Nigerian Naira (₦) for all amounts
6. Be conversational but direct — students want straight answers
7. When a purchase question is asked, provide structured reasoning

You MUST respond in this exact JSON format:
{
  "message": "Your conversational response text here. Be natural and human.",
  "recommendation": {
    "verdict": "yes" | "caution" | "no",
    "situation": {
      "currentBalance": number,
      "daysRemaining": number,
      "dailyBudget": number,
      "requestedAmount": number
    },
    "impact": {
      "remainingBalance": number,
      "newDailyBudget": number,
      "averageDailySpending": number,
      "budgetChangePercent": number,
      "savingsGoalImpact": "string"
    },
    "reasoning": [
      {
        "step": 1,
        "action": "What you checked",
        "finding": "What you found",
        "conclusion": "What you concluded"
      }
    ],
    "suggestion": "Alternative or advice string",
    "confidence": "high" | "medium" | "low"
  }
}

If the user is NOT asking about a purchase (e.g., general question), respond with:
{
  "message": "Your conversational response here"
}

Do NOT include recommendation field for non-purchase questions.`;
}
