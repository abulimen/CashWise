'use client';

import { useState } from 'react';
import { AIRecommendation } from '@/lib/types';

interface RecommendationCardProps {
  recommendation: AIRecommendation;
}

const verdictConfig = {
  yes: { icon: '✅', label: 'Go for it', className: 'verdict-yes' },
  caution: { icon: '⚠️', label: 'Caution — Think twice', className: 'verdict-caution' },
  no: { icon: '❌', label: 'Not recommended', className: 'verdict-no' },
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const verdict = verdictConfig[recommendation.verdict];

  const formatAmount = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  return (
    <div className="recommendation-card">
      {/* Verdict Header */}
      <div className={`recommendation-verdict ${verdict.className}`}>
        <span>{verdict.icon}</span>
        <span>{verdict.label}</span>
      </div>

      <div className="recommendation-body">
        {/* Your Situation */}
        <div className="recommendation-section">
          <div className="recommendation-section-title">Your situation right now</div>
          <div className="recommendation-row">
            <span className="recommendation-row-label">Balance</span>
            <span className="recommendation-row-value">{formatAmount(recommendation.situation.currentBalance)}</span>
          </div>
          <div className="recommendation-row">
            <span className="recommendation-row-label">Days remaining</span>
            <span className="recommendation-row-value">{recommendation.situation.daysRemaining} days</span>
          </div>
          <div className="recommendation-row">
            <span className="recommendation-row-label">Daily budget</span>
            <span className="recommendation-row-value">{formatAmount(recommendation.situation.dailyBudget)}/day</span>
          </div>
        </div>

        {/* Impact */}
        <div className="recommendation-section">
          <div className="recommendation-section-title">If you buy this</div>
          <div className="recommendation-row">
            <span className="recommendation-row-label">Remaining balance</span>
            <span className="recommendation-row-value">{formatAmount(recommendation.impact.remainingBalance)}</span>
          </div>
          <div className="recommendation-row">
            <span className="recommendation-row-label">New daily budget</span>
            <span className="recommendation-row-value">{formatAmount(recommendation.impact.newDailyBudget)}/day</span>
          </div>
          <div className="recommendation-row">
            <span className="recommendation-row-label">Your avg. spending</span>
            <span className="recommendation-row-value">{formatAmount(recommendation.impact.averageDailySpending)}/day</span>
          </div>
          {recommendation.impact.budgetChangePercent !== 0 && (
            <div className="recommendation-row">
              <span className="recommendation-row-label">Budget change</span>
              <span
                className="recommendation-row-value"
                style={{ color: recommendation.impact.budgetChangePercent < 0 ? 'var(--color-caution)' : 'var(--color-yes)' }}
              >
                {recommendation.impact.budgetChangePercent > 0 ? '+' : ''}{recommendation.impact.budgetChangePercent}%
              </span>
            </div>
          )}
          {recommendation.impact.savingsGoalImpact && (
            <div className="recommendation-row">
              <span className="recommendation-row-label">Savings impact</span>
              <span className="recommendation-row-value" style={{ fontSize: 'var(--text-xs)' }}>
                {recommendation.impact.savingsGoalImpact}
              </span>
            </div>
          )}
        </div>

        {/* Reasoning (expandable) */}
        {recommendation.reasoning.length > 0 && (
          <div className="reasoning-section">
            <button
              className="reasoning-toggle"
              onClick={() => setShowReasoning(!showReasoning)}
            >
              <span className={`reasoning-toggle-icon ${showReasoning ? 'open' : ''}`}>▶</span>
              <span>Here&apos;s why — {recommendation.reasoning.length} steps of reasoning</span>
            </button>

            {showReasoning && (
              <div className="reasoning-steps">
                {recommendation.reasoning.map((step) => (
                  <div key={step.step} className="reasoning-step">
                    <div className="reasoning-step-action">{step.action}</div>
                    <div className="reasoning-step-detail">
                      {step.finding} → {step.conclusion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggestion */}
        {recommendation.suggestion && (
          <div className="recommendation-suggestion">
            <strong>💡 Suggestion:</strong> {recommendation.suggestion}
          </div>
        )}
      </div>
    </div>
  );
}
