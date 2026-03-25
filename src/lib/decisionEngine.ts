import { FinancialData, AIRecommendation, ReasoningStep, ConfidenceLevel } from './types';

/**
 * Decision Engine — The core "Can I afford this?" logic.
 *
 * Takes the user's financial data and a requested purchase amount,
 * returns a structured recommendation with every reasoning step documented.
 * The user can verify each step against their own knowledge.
 */

interface DecisionInput {
  amount: number;
  description: string;
  financialData: FinancialData;
}

interface ParsedAmount {
  amount: number;
  description: string;
}

/**
 * Try to extract an amount and item from a user's message.
 * Handles common Nigerian currency patterns.
 */
export function parseAmountFromMessage(message: string): ParsedAmount | null {
  // Match patterns like: ₦12,000 | ₦12k | 12,000 | 12000 | N12000 | 12k
  const patterns = [
    /[₦N]?\s*([\d,]+(?:\.\d{2})?)\s*(?:naira)?/i,
    /[₦N]?\s*(\d+)\s*k\b/i, // 12k → 12000
  ];

  let amount: number | null = null;

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      let raw = match[1].replace(/,/g, '');
      amount = parseFloat(raw);
      // Handle "k" shorthand
      if (message.toLowerCase().includes('k') && amount < 1000) {
        amount *= 1000;
      }
      break;
    }
  }

  if (!amount || amount <= 0) return null;

  // Try to extract what they want to buy
  const descriptionPatterns = [
    /(?:buy|get|afford|purchase|spend on)\s+(?:a\s+|an\s+|some\s+)?(.+?)(?:\s+for|\s+at|\?|$)/i,
    /(?:for|on)\s+(?:a\s+|an\s+|some\s+)?(.+?)(?:\s+for|\?|$)/i,
  ];

  let description = 'this item';
  for (const pattern of descriptionPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      description = match[1].trim().replace(/[?.!,]+$/, '');
      break;
    }
  }

  return { amount, description };
}

/**
 * Generate a full decision with reasoning chain.
 */
export function generateDecision(input: DecisionInput): AIRecommendation {
  const { amount, description, financialData } = input;
  const { balance, daysRemaining, dailyBudget, averageDailySpending, savingsGoal, currentSavings } = financialData;

  const reasoning: ReasoningStep[] = [];
  let stepNum = 1;

  // Step 1: Check balance
  const balanceAfter = balance - amount;
  const balancePercent = Math.round((amount / balance) * 100);
  reasoning.push({
    step: stepNum++,
    action: `Checked your current balance`,
    finding: `Your balance is ₦${balance.toLocaleString()}. This purchase is ₦${amount.toLocaleString()} (${balancePercent}% of your balance)`,
    conclusion: balanceAfter > 0
      ? `You technically have enough money`
      : `You don't have enough — you'd go negative by ₦${Math.abs(balanceAfter).toLocaleString()}`,
  });

  // Step 2: Calculate new daily budget
  const newDailyBudget = daysRemaining > 0 ? Math.round(balanceAfter / daysRemaining) : 0;
  const budgetChangePercent = dailyBudget > 0 ? Math.round(((newDailyBudget - dailyBudget) / dailyBudget) * 100) : -100;
  reasoning.push({
    step: stepNum++,
    action: `Calculated how this changes your daily budget`,
    finding: `With ${daysRemaining} days left, your daily budget would drop from ₦${dailyBudget.toLocaleString()} to ₦${newDailyBudget.toLocaleString()}`,
    conclusion: `That's a ${Math.abs(budgetChangePercent)}% ${budgetChangePercent < 0 ? 'decrease' : 'increase'} in your daily spending power`,
  });

  // Step 3: Compare to actual spending habits
  const canSustain = newDailyBudget >= averageDailySpending;
  const spendingGap = newDailyBudget - averageDailySpending;
  reasoning.push({
    step: stepNum++,
    action: `Compared new budget to your actual spending pattern`,
    finding: `You typically spend ₦${averageDailySpending.toLocaleString()}/day. After buying, you'd have ₦${newDailyBudget.toLocaleString()}/day`,
    conclusion: canSustain
      ? `Your new budget still covers your usual spending`
      : `You'd need to cut spending by ₦${Math.abs(spendingGap).toLocaleString()}/day — that's ${Math.round((Math.abs(spendingGap) / averageDailySpending) * 100)}% less than usual`,
  });

  // Step 4: Check savings goal impact
  const savingsRemaining = savingsGoal - currentSavings;
  const monthlySavingsTarget = savingsRemaining; // simplified
  const canStillSave = balanceAfter > (averageDailySpending * daysRemaining);
  let savingsGoalImpact = '';

  if (savingsRemaining > 0) {
    if (canStillSave) {
      const potentialSavings = balanceAfter - (averageDailySpending * daysRemaining);
      savingsGoalImpact = `You could still save about ₦${Math.max(0, potentialSavings).toLocaleString()} this month`;
    } else {
      savingsGoalImpact = `Reaching your ₦${savingsGoal.toLocaleString()} goal becomes very difficult`;
    }
    reasoning.push({
      step: stepNum++,
      action: `Checked impact on your savings goal`,
      finding: `You've saved ₦${currentSavings.toLocaleString()} of your ₦${savingsGoal.toLocaleString()} goal. You still need ₦${savingsRemaining.toLocaleString()}`,
      conclusion: savingsGoalImpact,
    });
  }

  // Determine verdict
  let verdict: 'yes' | 'caution' | 'no';
  let confidence: ConfidenceLevel;

  if (balanceAfter < 0) {
    verdict = 'no';
    confidence = 'high';
  } else if (!canSustain || balancePercent > 40) {
    verdict = 'caution';
    confidence = newDailyBudget > 0 ? 'high' : 'medium';
  } else if (balancePercent > 20) {
    verdict = 'caution';
    confidence = 'medium';
  } else {
    verdict = 'yes';
    confidence = 'high';
  }

  // Generate suggestion
  let suggestion = '';
  if (verdict === 'no') {
    suggestion = `You don't have enough for this right now. Consider waiting until your next allowance or finding a more affordable alternative.`;
  } else if (verdict === 'caution') {
    const saferAmount = Math.round(dailyBudget * 3); // ~3 days of budget feels safe
    if (amount > saferAmount) {
      suggestion = `If you can wait until after month-end when fresh funds come in, your budget stays healthy. If you really need it now, could you find something closer to ₦${saferAmount.toLocaleString()}?`;
    } else {
      suggestion = `You can afford this, but it'll tighten things. Maybe skip one non-essential purchase this week to balance it out.`;
    }
  } else {
    suggestion = `This fits comfortably within your budget. Go ahead!`;
  }

  return {
    verdict,
    situation: {
      currentBalance: balance,
      daysRemaining,
      dailyBudget,
      requestedAmount: amount,
    },
    impact: {
      remainingBalance: balanceAfter,
      newDailyBudget,
      averageDailySpending,
      budgetChangePercent,
      savingsGoalImpact,
    },
    reasoning,
    suggestion,
    confidence,
  };
}
