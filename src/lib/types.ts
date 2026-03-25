// ============================================
// CashWise V2 — Shared TypeScript Types
// ============================================

// --- Financial Data ---

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string; // ISO date string
  narration: string;
}

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'airtime'
  | 'entertainment'
  | 'education'
  | 'shopping'
  | 'savings'
  | 'income'
  | 'transfer'
  | 'other';

export interface FinancialData {
  balance: number;
  currency: string;
  daysRemaining: number;
  dailyBudget: number; // balance / daysRemaining
  averageDailySpending: number; // calculated from recent transactions
  savingsGoal: number;
  currentSavings: number;
  transactions: Transaction[];
  lastUpdated: string;
}

// --- Chat ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendation?: AIRecommendation;
  confidenceScore?: number;
  citations?: DataCitation[];
  reasoningTrace?: string;
  usedPromptSnippet?: string;
  adviceMeta?: AdviceMeta;
}

export interface AIRecommendation {
  verdict: 'yes' | 'caution' | 'no';
  situation: SituationSummary;
  impact: ImpactAssessment;
  reasoning: ReasoningStep[];
  suggestion: string;
  confidence: ConfidenceLevel;
}

export interface SituationSummary {
  currentBalance: number;
  daysRemaining: number;
  dailyBudget: number;
  requestedAmount: number;
}

export interface ImpactAssessment {
  remainingBalance: number;
  newDailyBudget: number;
  averageDailySpending: number;
  budgetChangePercent: number; // negative = tighter
  savingsGoalImpact: string; // e.g. "Makes your ₦50k goal nearly impossible"
}

export interface ReasoningStep {
  step: number;
  action: string;   // What the AI checked
  finding: string;  // What it found
  conclusion: string; // What it concluded
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// --- Trust Score ---

export interface TrustScoreResult {
  overall: number; // 0–100
  label: 'Excellent' | 'Good' | 'Fair' | 'Risky';
  factors: TrustScoreFactor[];
}

export interface TrustScoreFactor {
  name: string;
  score: number; // 0–100
  weight: number; // 0–1, must sum to 1
  explanation: string; // plain-language reason
}

// --- Auto-Stash ---

export interface AutoStashSuggestion {
  incomingAmount: number;
  suggestedSavings: number;
  reasoning: string; // e.g. "Based on your goal of ₦50,000 and current savings of ₦12,000"
  savingsGoal: number;
  currentSavings: number;
  confidenceScore?: number;
  citations?: DataCitation[];
  reasoningTrace?: string;
  usedPromptSnippet?: string;
}

// --- API ---

export interface ChatRequest {
  message: string;
  financialData: FinancialData;
  conversationHistory: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  recommendation?: AIRecommendation;
  confidenceScore?: number;
  citations?: DataCitation[];
  reasoningTrace?: string;
  usedPromptSnippet?: string;
  adviceMeta?: AdviceMeta;
}

export interface FinancialDataResponse {
  data: FinancialData;
  source: 'mock' | 'mono';
}

export interface UserProfile {
  userId: string;
  name: string;
  school?: string;
  allowanceCycleDays?: number;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string;
}

export interface DataCitation {
  txId: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface AiFeedbackRow {
  user_id: string;
  query: string;
  ai_suggestion: string;
  user_explanation: string;
  timestamp: string;
}

export interface AdviceMeta {
  actionType: 'Chat' | 'Auto-Stash';
  suggestion: string;
  decision?: 'Accepted' | 'Overridden';
  explanation?: string;
}
