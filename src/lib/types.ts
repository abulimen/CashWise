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
}

export interface FinancialDataResponse {
  data: FinancialData;
  source: 'mock' | 'mono';
}
