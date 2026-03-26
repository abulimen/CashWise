'use client';

import { useState } from 'react';
import { AutoStashSuggestion } from '@/lib/types';
import { formatNaira } from '@/lib/currency';
import { Check } from 'lucide-react';

interface AutoStashProps {
  suggestion: Partial<AutoStashSuggestion>;
  onAccept: () => void;
  onDecline: () => void;
  onSubmitFeedback: (explanation: string) => void;
}

export function AutoStash({ suggestion, onAccept, onDecline, onSubmitFeedback }: AutoStashProps) {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [reason, setReason] = useState('My spending is usually lower');
  const [text, setText] = useState('' );
  const [showProvenance, setShowProvenance] = useState(false);

  const incoming = suggestion.incomingAmount ?? 0;
  const saving = suggestion.suggestedSavings ?? 0;
  const pct = incoming > 0 ? Math.round((saving / incoming) * 100) : 0;
  const confScore = typeof suggestion.confidenceScore === 'number' ? suggestion.confidenceScore : null;
  const confClass = confScore === null
    ? ''
    : confScore >= 90
      ? 'autostash-confidence-good'
      : confScore >= 70
        ? 'autostash-confidence-mid'
        : 'autostash-confidence-low';

  return (
    <div className="autostash-proposal-card" id="autostash-proposal">
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
        Smart Savings Suggestion
      </div>
      <div className="autostash-prompt">
        Stash {formatNaira(saving)} from your {formatNaira(incoming)} inflow?
      </div>
      <div className="autostash-reasoning">
        {suggestion.reasoning ?? 'Based on your goals and recent spending patterns.'}
      </div>
      {confScore !== null && (
        <div className={`autostash-confidence ${confClass}`}>
          Confidence: {confScore}/100
        </div>
      )}

      {/* Decision provenance */}
      <details className="xai-accordion" open={showProvenance} onToggle={(e) => setShowProvenance((e.target as HTMLDetailsElement).open)}>
        <summary>Decision provenance</summary>
        <div className="xai-content provenance-card" style={{ background: 'none', padding: 0 }}>
          <div className="provenance-row"><span className="provenance-dot" /><span>Inflow detected: {formatNaira(incoming)}</span></div>
          <div className="provenance-row"><span className="provenance-dot" /><span>Savings goal: {formatNaira(suggestion.savingsGoal ?? 0)} (saved: {formatNaira(suggestion.currentSavings ?? 0)})</span></div>
          <div className="provenance-row"><span className="provenance-dot" /><span>Rule: Stash {pct}% of inflow toward active goals</span></div>
          <div className="provenance-row"><span className="provenance-dot" /><span>{suggestion.reasoningTrace ?? 'Derived from your recent spending trend.'}</span></div>
        </div>
      </details>

      <div className="autostash-actions" style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={onAccept} id="autostash-accept-btn">
          <Check size={16} /> Stash it
        </button>
        <button className="btn btn-outline" onClick={() => setShowWhyModal(true)} id="autostash-decline-btn">
          No, here&apos;s why…
        </button>
      </div>

      {showWhyModal && (
        <div className="consent-overlay" role="dialog" aria-modal="true">
          <div className="consent-modal">
            <div className="consent-title">Why do you disagree?</div>
            <div className="feedback-chip-wrap">
              {['My spending is usually lower', 'I have extra cash coming', 'This goal isn\'t priority anymore', 'Other'].map((c) => (
                <button key={c} className={`feedback-chip ${reason === c ? 'active' : ''}`} onClick={() => setReason(c)}>
                  {c}
                </button>
              ))}
            </div>
            <textarea
              className="feedback-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add your explanation"
            />
            <div className="consent-actions">
              <button
                className="consent-btn consent-btn-allow"
                onClick={() => {
                  const explanation = reason === 'Other' ? text.trim() : `${reason}${text ? `: ${text.trim()}` : ''}`;
                  onSubmitFeedback(explanation);
                  onDecline();
                  setShowWhyModal(false);
                }}
              >Submit</button>
              <button className="consent-btn consent-btn-cancel" onClick={() => setShowWhyModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
