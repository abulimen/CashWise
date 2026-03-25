import { FinancialData, Transaction, UserProfile, UpcomingBill, SavingsGoal, DataCitation, AiFeedbackRow } from '@/lib/types';
import { callGemini } from '@/lib/geminiClient';

export interface RetrievalContext {
  userId: string;
  retrievedAt: string;
  transactions: Array<{ tx_id: string; date: string; amount: number; category: string; description: string; narration: string; type: 'debit' | 'credit' }>;
  profile: UserProfile;
  upcomingBills: UpcomingBill[];
  savingsGoals: SavingsGoal[];
  recentFeedback: AiFeedbackRow[];
}

export interface JudgedAiResponse {
  finalResponse: string;
  confidenceScore: number;
  citations: DataCitation[];
  reasoningTrace: string;
  usedPromptSnippet: string;
}

const PRIMARY_SYSTEM_PROMPT = `You are CashWise, a smart older sibling financial advisor for Nigerian students.
Rules you MUST follow in EVERY response:
- Start with a clear Yes/No or short answer.
- ALWAYS cite the exact data you used, using natural language. Examples:
  'Based on your ₦12,450 food spending last week (transactions on Mon, Wed, Fri)...'
  'Your current balance is ₦47,230 and you have 11 days until allowance.'
- Never make up numbers or transactions. If data is missing or old, say so.`;

const JUDGE_PROMPT_PREFIX = `You are a strict financial auditor. Here is the draft response and the exact data used:`;

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sanitizeJudgeOutput(raw: string): { text: string; confidence: number } {
  const confidenceMatch =
    raw.match(/confidence\s*score\s*[:\-]?\s*(\d{1,3})/i) ||
    raw.match(/(\d{1,3})\s*\/\s*100/i);
  const confidence = clampConfidence(confidenceMatch ? Number(confidenceMatch[1]) : 0);

  let text = raw
    .replace(/[*_`]/g, '')
    .replace(/\n?confidence\s*score\s*[:\-]?\s*\d{1,3}(?:\s*\/\s*100)?\s*$/i, '')
    .trim();

  const correctedMatch = text.match(/corrected response\s*:\s*([\s\S]*)/i);
  if (correctedMatch?.[1]) {
    text = correctedMatch[1].trim();
  }

  text = text
    .replace(/^no\.\s*correction:\s*/i, 'No. ')
    .replace(/^\s*correction:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { text, confidence };
}

function buildCitations(transactions: RetrievalContext['transactions']): DataCitation[] {
  return transactions.slice(0, 8).map((txn) => ({
    txId: txn.tx_id,
    date: txn.date,
    amount: txn.amount,
    category: txn.category,
    description: txn.description,
  }));
}

function buildReasoningTrace(context: RetrievalContext): string {
  const billsTotal = context.upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
  return `Used ${context.transactions.length} transactions, ${context.upcomingBills.length} upcoming bills (₦${billsTotal.toLocaleString('en-NG')} total), ${context.savingsGoals.length} savings goals, and ${context.recentFeedback.length} recent overrides.`;
}

export async function generateJudgedAdvice(params: {
  userQuery: string;
  retrievalContext: RetrievalContext;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<JudgedAiResponse> {
  const { userQuery, retrievalContext, conversationHistory = [] } = params;

  const contextBlock = JSON.stringify(retrievalContext, null, 2);
  const history = conversationHistory.slice(-6).map((msg) => ({
    role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
    parts: [{ text: msg.content }],
  }));

  const primary = await callGemini(
    PRIMARY_SYSTEM_PROMPT,
    `User query: ${userQuery}\n\nExact retrieved context:\n${contextBlock}`,
    history,
    {
      model: 'gemini-3.1-flash-lite-preview',
      temperature: 0.1,
      topP: 0.9,
      responseMimeType: 'text/plain',
      maxOutputTokens: 1200,
    }
  );

  const judgePrompt = `${JUDGE_PROMPT_PREFIX} ${JSON.stringify({ draft: primary, retrieved: retrievalContext })}.
Tasks:
- Is every number and claim 100% grounded in the data? Yes/No
- If any hallucination or unsupported claim, rewrite the sentence correctly or say 'I don't have enough info'.
- Output ONLY the corrected final response + a Confidence score 0-100 (only 90+ if fully grounded).`;

  const judged = await callGemini(
    'You are a strict financial auditor.',
    judgePrompt,
    [],
    {
      model: 'gemini-3.1-flash-lite-preview',
      temperature: 0,
      topP: 0.1,
      responseMimeType: 'text/plain',
      maxOutputTokens: 1200,
    }
  );

  const parsed = sanitizeJudgeOutput(judged);
  const confidenceScore = parsed.confidence;
  const finalResponse = parsed.text;

  return {
    finalResponse,
    confidenceScore,
    citations: buildCitations(retrievalContext.transactions),
    reasoningTrace: buildReasoningTrace(retrievalContext),
    usedPromptSnippet: 'Start with a clear Yes/No or short answer. Never make up numbers or transactions.',
  };
}

export function buildRetrievalContext(params: {
  userId: string;
  financialData: FinancialData;
  profile?: UserProfile;
  upcomingBills?: UpcomingBill[];
  savingsGoals?: SavingsGoal[];
  recentFeedback?: AiFeedbackRow[];
}): RetrievalContext {
  const {
    userId,
    financialData,
    profile,
    upcomingBills = [],
    savingsGoals = [],
    recentFeedback = [],
  } = params;

  const transactions = [...financialData.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 25)
    .map((txn: Transaction) => ({
      tx_id: txn.id,
      date: txn.date,
      amount: txn.amount,
      category: txn.category,
      description: txn.description,
      narration: txn.narration,
      type: txn.type,
    }));

  return {
    userId,
    retrievedAt: new Date().toISOString(),
    transactions,
    profile: profile || {
      userId,
      name: 'CashWise User',
      school: 'University Student',
      allowanceCycleDays: 30,
    },
    upcomingBills,
    savingsGoals,
    recentFeedback,
  };
}
