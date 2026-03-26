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

const UPDATE_EXTRACTOR = `You are CashWise profile update parser.
Extract only explicit profile edits from the user command.
Return strict JSON:
{
  "isUpdateCommand": true|false,
  "summary": "short summary",
  "confidence": 0-100,
  "patch": {},
  "followUpQuestion": "optional if ambiguous"
}`;

export interface ProfileUpdateDraft {
  isUpdateCommand: boolean;
  summary: string;
  confidence: number;
  patch: Record<string, unknown>;
  followUpQuestion?: string;
}

function normalizeFollowUp(activeQuestion: string, followUpQuestion?: string): string {
  const follow = String(followUpQuestion || '').trim();
  if (!follow) return '';
  const activeKeywords = activeQuestion.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const followLower = follow.toLowerCase();
  const keywordHit = activeKeywords.some((word) => followLower.includes(word));
  return keywordHit ? follow : '';
}

export async function runOnboardingExtraction(
  userText: string,
  priorDraft?: Record<string, unknown>,
  options?: { questionIndex?: number; activeQuestion?: string }
): Promise<OnboardingResult> {
  const activeQuestion = options?.activeQuestion || 'General onboarding question';
  const questionIndex = Number(options?.questionIndex || 0);
  const prompt = `User onboarding input: ${userText}
Active question (${questionIndex + 1}/5): ${activeQuestion}
Prior draft: ${JSON.stringify(priorDraft || {}, null, 2)}
Rules:
- Focus extraction on the active question first.
- Do not ask about a different section while active question is unresolved.
- Only add followUpQuestion if active question is still missing critical data.
- Never repeat an identical follow-up.`;

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
  const followUp = normalizeFollowUp(activeQuestion, parsed.followUpQuestion);

  return {
    profileDraft: parsed.profileDraft || {},
    sections: (parsed.sections || []).map((s) => ({
      ...s,
      confidence: Math.max(0, Math.min(100, Math.round(Number(s.confidence) || 0))),
    })),
    followUpQuestion: followUp || undefined,
    xaiInputs: [userText],
    reasoningTrace: 'Parsed natural language profile input and verified extraction with strict judge pass.',
  };
}

export async function proposeProfileUpdateFromChat(params: {
  userMessage: string;
  currentProfile: Record<string, unknown>;
}): Promise<ProfileUpdateDraft> {
  const raw = await callGemini(
    UPDATE_EXTRACTOR,
    `Current profile: ${JSON.stringify(params.currentProfile, null, 2)}
User message: ${params.userMessage}
Only extract updates that are explicitly requested.`,
    [],
    {
      model: 'gemini-3.1-flash-lite-preview',
      temperature: 0.1,
      topP: 0.9,
      responseMimeType: 'application/json',
      maxOutputTokens: 900,
    }
  );

  const parsed = JSON.parse(raw) as Partial<ProfileUpdateDraft>;
  const patch = (parsed.patch && typeof parsed.patch === 'object') ? parsed.patch as Record<string, unknown> : {};
  const isUpdateCommand = Boolean(parsed.isUpdateCommand) || Object.keys(patch).length > 0;
  return {
    isUpdateCommand,
    summary: String(parsed.summary || 'Profile update extracted from your message.'),
    confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence || 0)))),
    patch,
    followUpQuestion: parsed.followUpQuestion ? String(parsed.followUpQuestion) : undefined,
  };
}
