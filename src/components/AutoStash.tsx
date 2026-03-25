'use client';

import { useState } from 'react';
import { AutoStashSuggestion } from '@/lib/types';

interface AutoStashProps {
  suggestion: AutoStashSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  onSubmitFeedback: (explanation: string) => void;
}

export function AutoStash({ suggestion, onAccept, onDecline, onSubmitFeedback }: AutoStashProps) {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [reason, setReason] = useState('My spending is usually lower');
  const [text, setText] = useState('');
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
        <button className="auto-stash-btn auto-stash-btn-decline" onClick={() => setShowWhyModal(true)}>
          No, and here&apos;s why…
        </button>
      </div>

      <details className="xai-accordion" open>
        <summary>Decision provenance</summary>
        <div className="xai-content">
          <div>Inflow detected: {formatAmount(suggestion.incomingAmount)}</div>
          <div>Goals analyzed: {formatAmount(suggestion.currentSavings)} saved of {formatAmount(suggestion.savingsGoal)}</div>
          <div>Current daily burn: {suggestion.reasoningTrace || 'Derived from your recent spending trend.'}</div>
          <div>Suggestion breakdown: Suggested {formatAmount(suggestion.suggestedSavings)} stash.</div>
        </div>
      </details>

      {showWhyModal && (
        <div className="consent-overlay" role="dialog" aria-modal="true">
          <div className="consent-modal glass-card">
            <div className="consent-title">Why do you disagree?</div>
            <div className="feedback-chip-wrap">
              {['My spending is usually lower', 'I have extra cash coming', 'This goal isn’t priority anymore', 'Other'].map((choice) => (
                <button key={choice} className={`feedback-chip ${reason === choice ? 'active' : ''}`} onClick={() => setReason(choice)}>
                  {choice}
                </button>
              ))}
            </div>
            <textarea className="feedback-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add your explanation" />
            <div className="consent-actions">
              <button
                className="consent-btn consent-btn-allow"
                onClick={() => {
                  const explanation = reason === 'Other' ? text.trim() : `${reason}${text ? `: ${text.trim()}` : ''}`;
                  onSubmitFeedback(explanation);
                  onDecline();
                  setShowWhyModal(false);
                }}
              >
                Submit
              </button>
              <button className="consent-btn consent-btn-cancel" onClick={() => setShowWhyModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
