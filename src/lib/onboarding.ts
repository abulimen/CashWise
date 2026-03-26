import { callGemini } from '@/lib/geminiClient';

export interface OnboardingSection {
  name: string;
  summary: string;
  confidence: number;
  citation: string;
}

export interface OnboardingResult {
  profileDraft: Record<string, unknown>;
  sections: OnboardingSection[];
  followUpQuestion?: string;
  xaiInputs: string[];
  reasoningTrace: string;
}

const PRIMARY = `You are CashWise onboarding assistant.
Extract and structure user finance profile from natural text.
Do not assume missing fields. Ask a follow-up if unclear.
Return strict JSON with:
{
  "profileDraft": {
    "allowance": {"frequency":"", "range":"", "installments":"", "notes":""},
    "fixedExpenses": [],
    "variableExpenses": [],
    "savingGoals": [],
    "habits": {"impulsiveBuying": "unknown|yes|no", "betting": "unknown|yes|no", "coachingOptIn": false},
    "preferences": []
  },
  "sections": [{"name":"", "summary":"", "confidence":0, "citation":"You said: ..."}],
  "followUpQuestion":"optional"
}`;

const JUDGE = `You are a strict onboarding auditor.
Verify all extracted claims against user text only.
If uncertain, lower confidence and add follow-up question.
Output ONLY corrected JSON in the same schema.`;

export async function runOnboardingExtraction(userText: string, priorDraft?: Record<string, unknown>): Promise<OnboardingResult> {
  const prompt = `User onboarding input: ${userText}\nPrior draft: ${JSON.stringify(priorDraft || {}, null, 2)}`;

  const draftRaw = await callGemini(PRIMARY, prompt, [], {
    model: 'gemini-3.1-flash-lite-preview',
    temperature: 0.1,
    topP: 0.9,
    responseMimeType: 'application/json',
    maxOutputTokens: 1400,
  });

  const judgedRaw = await callGemini(JUDGE, `Draft JSON: ${draftRaw}\nOriginal input: ${userText}`, [], {
    model: 'gemini-3.1-flash-lite-preview',
    temperature: 0,
    topP: 0.1,
    responseMimeType: 'application/json',
    maxOutputTokens: 1400,
  });

  const parsed = JSON.parse(judgedRaw) as {
    profileDraft?: Record<string, unknown>;
    sections?: Array<{ name: string; summary: string; confidence: number; citation: string }>;
    followUpQuestion?: string;
  };

  return {
    profileDraft: parsed.profileDraft || {},
    sections: (parsed.sections || []).map((s) => ({
      ...s,
      confidence: Math.max(0, Math.min(100, Math.round(Number(s.confidence) || 0))),
    })),
    followUpQuestion: parsed.followUpQuestion,
    xaiInputs: [userText],
    reasoningTrace: 'Parsed natural language profile input and verified extraction with strict judge pass.',
  };
}
