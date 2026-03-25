import { FinancialData, TrustScoreResult, TrustScoreFactor } from './types';

/**
 * Rule-based Trust Score calculator.
 * Returns 0–100 score with per-factor breakdown the user can inspect.
 */

export function calculateTrustScore(data: FinancialData): TrustScoreResult {
  const factors: TrustScoreFactor[] = [
    calculateSpendingDiscipline(data),
    calculateSavingsConsistency(data),
    calculateBalanceStability(data),
  ];

  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  let label: TrustScoreResult['label'];
  if (overall >= 80) label = 'Excellent';
  else if (overall >= 65) label = 'Good';
  else if (overall >= 45) label = 'Fair';
  else label = 'Risky';

  return { overall, label, factors };
}

function calculateSpendingDiscipline(data: FinancialData): TrustScoreFactor {
  const { dailyBudget, averageDailySpending, transactions } = data;

  // How well do they stay within their daily budget?
  const spendingRatio = dailyBudget > 0 ? averageDailySpending / dailyBudget : 1;
  let score: number;

  if (spendingRatio <= 0.7) score = 95; // well under budget
  else if (spendingRatio <= 0.9) score = 80;
  else if (spendingRatio <= 1.0) score = 65;
  else if (spendingRatio <= 1.2) score = 45; // slightly over
  else score = 25; // significantly over

  // Bonus/penalty for entertainment vs essential ratio
  const entCount = transactions.filter(t => t.category === 'entertainment').length;
  const totalDebitCount = transactions.filter(t => t.type === 'debit').length;
  if (totalDebitCount > 0) {
    const entRatio = entCount / totalDebitCount;
    if (entRatio > 0.3) score = Math.max(20, score - 10);
  }

  const ratioPercent = Math.round(spendingRatio * 100);
  const explanation =
    spendingRatio <= 1
      ? `You spend ${ratioPercent}% of your daily budget on average — well controlled`
      : `Your average daily spend is ${ratioPercent}% of your budget — you're slightly over`;

  return {
    name: 'Spending Discipline',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.4,
    explanation,
  };
}

function calculateSavingsConsistency(data: FinancialData): TrustScoreFactor {
  const { savingsGoal, currentSavings, transactions } = data;

  // Has the user saved anything this month?
  const savingsTransactions = transactions.filter(t => t.category === 'savings');
  const savedThisMonth = savingsTransactions.reduce((sum, t) => sum + t.amount, 0);

  // How far along are they toward their goal?
  const goalProgress = savingsGoal > 0 ? currentSavings / savingsGoal : 0;
  let score: number;

  if (savedThisMonth === 0) {
    score = 30; // no savings activity at all
  } else if (goalProgress >= 0.5) {
    score = 90;
  } else if (goalProgress >= 0.3) {
    score = 75;
  } else if (goalProgress >= 0.15) {
    score = 60;
  } else {
    score = 45;
  }

  const progressPercent = Math.round(goalProgress * 100);
  const explanation =
    savedThisMonth === 0
      ? `No savings recorded this month — start small to build the habit`
      : `You've saved ${progressPercent}% of your ₦${savingsGoal.toLocaleString()} goal`;

  return {
    name: 'Savings Consistency',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.35,
    explanation,
  };
}

function calculateBalanceStability(data: FinancialData): TrustScoreFactor {
  const { balance, transactions, daysRemaining } = data;

  // Check if balance is covering expected remaining expenses
  const avgSpend = data.averageDailySpending;
  const projectedNeed = avgSpend * daysRemaining;
  const coverageRatio = projectedNeed > 0 ? balance / projectedNeed : 1;

  let score: number;
  if (coverageRatio >= 1.5) score = 90; // lots of buffer
  else if (coverageRatio >= 1.1) score = 75;
  else if (coverageRatio >= 0.9) score = 60; // tight but OK
  else if (coverageRatio >= 0.6) score = 40;
  else score = 20; // at risk of running out

  // Penalise large single withdrawals (>30% of balance)
  const largeWithdrawals = transactions.filter(
    t => t.type === 'debit' && t.amount > balance * 0.3
  );
  if (largeWithdrawals.length > 0) score = Math.max(20, score - 10);

  const explanation =
    coverageRatio >= 1.1
      ? `Your balance can comfortably cover your remaining estimated expenses`
      : coverageRatio >= 0.9
        ? `Your balance is tight — just enough to cover the rest of the month at your current pace`
        : `Your balance may not cover your usual spending for the rest of the month`;

  return {
    name: 'Balance Stability',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.25,
    explanation,
  };
}
