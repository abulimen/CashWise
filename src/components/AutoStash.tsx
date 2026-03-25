'use client';

import { AutoStashSuggestion } from '@/lib/types';

interface AutoStashProps {
  suggestion: AutoStashSuggestion;
  onAccept: () => void;
  onDecline: () => void;
}

export function AutoStash({ suggestion, onAccept, onDecline }: AutoStashProps) {
  const formatAmount = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  return (
    <div className="glass-card auto-stash-card">
      <div className="auto-stash-header">
        <span className="auto-stash-icon">🏦</span>
        <span className="auto-stash-title">Smart Savings Suggestion</span>
      </div>

      <div className="auto-stash-prompt">
        You received {formatAmount(suggestion.incomingAmount)}. Save{' '}
        {formatAmount(suggestion.suggestedSavings)}?
      </div>

      <div className="auto-stash-reasoning">
        {suggestion.reasoning}
      </div>

      <div className="auto-stash-actions">
        <button className="auto-stash-btn auto-stash-btn-accept" onClick={onAccept}>
          Save {formatAmount(suggestion.suggestedSavings)}
        </button>
        <button className="auto-stash-btn auto-stash-btn-adjust">
          Adjust
        </button>
        <button className="auto-stash-btn auto-stash-btn-decline" onClick={onDecline}>
          Skip
        </button>
      </div>
    </div>
  );
}
