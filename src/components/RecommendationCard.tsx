'use client';

import { useState } from 'react';
import { AIRecommendation } from '@/lib/types';

interface RecommendationCardProps {
  recommendation: AIRecommendation;
}

const verdictConfig = {
  yes:     { icon: '✅', label: 'Go for it',             className: 'rec-verdict-yes' },
  caution: { icon: '⚠️', label: 'Caution — Think twice', className: 'rec-verdict-caution' },
  no:      { icon: '❌', label: 'Not recommended',        className: 'rec-verdict-no' },
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const verdict = verdictConfig[recommendation.verdict];
  const fmt = (n: number) => `₦${n.toLocaleString('en-NG')}`;

  return (
    <div className="rec-card">
      <div className={`rec-verdict ${verdict.className}`}>
        <span>{verdict.icon}</span>
        <span>{verdict.label}</span>
      </div>

      <div className="rec-body">
        {/* Situation */}
        <div>
          <div className="rec-section-title">Your situation right now</div>
          <div className="rec-row">
            <span className="rec-row-label">Balance</span>
            <span className="rec-row-value">{fmt(recommendation.situation.currentBalance)}</span>
          </div>
          <div className="rec-row">
            <span className="rec-row-label">Days remaining</span>
            <span className="rec-row-value">{recommendation.situation.daysRemaining} days</span>
          </div>
          <div className="rec-row">
            <span className="rec-row-label">Daily budget</span>
            <span className="rec-row-value">{fmt(recommendation.situation.dailyBudget)}/day</span>
          </div>
        </div>

        {/* Impact */}
        <div>
          <div className="rec-section-title">If you buy this</div>
          <div className="rec-row">
            <span className="rec-row-label">Remaining balance</span>
            <span className="rec-row-value">{fmt(recommendation.impact.remainingBalance)}</span>
          </div>
          <div className="rec-row">
            <span className="rec-row-label">New daily budget</span>
            <span className="rec-row-value">{fmt(recommendation.impact.newDailyBudget)}/day</span>
          </div>
          <div className="rec-row">
            <span className="rec-row-label">Your avg. spending</span>
            <span className="rec-row-value">{fmt(recommendation.impact.averageDailySpending)}/day</span>
          </div>
          {recommendation.impact.budgetChangePercent !== 0 && (
            <div className="rec-row">
              <span className="rec-row-label">Budget change</span>
              <span
                className="rec-row-value"
                style={{ color: recommendation.impact.budgetChangePercent < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
              >
                {recommendation.impact.budgetChangePercent > 0 ? '+' : ''}{recommendation.impact.budgetChangePercent}%
              </span>
            </div>
          )}
          {recommendation.impact.savingsGoalImpact && (
            <div className="rec-row">
              <span className="rec-row-label">Savings impact</span>
              <span className="rec-row-value" style={{ fontSize: 12 }}>{recommendation.impact.savingsGoalImpact}</span>
            </div>
          )}
        </div>

        {/* Reasoning (expandable) */}
        {recommendation.reasoning.length > 0 && (
          <div>
            <button className="reasoning-toggle" onClick={() => setShowReasoning(!showReasoning)}>
              <span className={`reasoning-icon ${showReasoning ? 'open' : ''}`}>▶</span>
              Here&apos;s why — {recommendation.reasoning.length} steps of reasoning
            </button>
            {showReasoning && (
              <div className="reasoning-steps">
                {recommendation.reasoning.map((step) => (
                  <div key={step.step}>
                    <div className="reasoning-step-action">{step.action}</div>
                    <div className="reasoning-step-detail">{step.finding} → {step.conclusion}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggestion */}
        {recommendation.suggestion && (
          <div className="rec-suggestion">
            <strong>💡 Suggestion:</strong> {recommendation.suggestion}
          </div>
        )}
      </div>
    </div>
  );
}
