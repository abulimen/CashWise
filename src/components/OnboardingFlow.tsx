'use client';

import { useState } from 'react';

interface OnboardingFlowProps {
  onCompleted: () => void;
}

export function OnboardingFlow({ onCompleted }: OnboardingFlowProps) {
  const [consent, setConsent] = useState(false);
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [sections, setSections] = useState<Array<{ name: string; summary: string; confidence: number; citation: string }>>([]);
  const [followUp, setFollowUp] = useState('');
  const [showWhy, setShowWhy] = useState(false);
  const [disagreeReason, setDisagreeReason] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, profileDraft: draft }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setDraft(data.profileDraft || {});
      setSections(data.sections || []);
      setFollowUp(data.followUpQuestion || '');
      setInput('');
    } finally {
      setLoading(false);
    }
  };

  const save = async (accepted: boolean) => {
    const confidenceOverall = sections.length > 0
      ? Math.round(sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length)
      : 0;

    await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileDraft: draft,
        confidenceOverall,
        accepted,
        disagreementReason: disagreeReason,
      }),
    });

    if (accepted) onCompleted();
  };

  if (!consent) {
    return (
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <div className="recommendation-section-title" style={{ marginBottom: 'var(--space-3)' }}>Set Up My Financial Brain</div>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          To give you accurate advice, I&apos;ll ask about your income, expenses, goals, and habits. This info stays encrypted and is only used for your profile. You can delete or update anything anytime.
        </p>
        <div className="consent-actions">
          <button className="consent-btn consent-btn-allow" onClick={async () => { await fetch('/api/onboarding/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentGiven: true }) }); setConsent(true); }}>Start Onboarding</button>
          <button className="consent-btn consent-btn-cancel" onClick={() => setConsent(true)}>Skip Sensitive Parts</button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="recommendation-section-title">Conversational Profile Builder</div>
      <p style={{ color: 'var(--color-text-secondary)' }}>Type naturally: allowance timing/range, fixed costs (Spotify), variable costs (data every 3-5 days), goals, and habits.</p>
      <div className="chat-input-wrapper">
        <input className="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Example: My allowance comes twice monthly, ₦40k-₦60k. Data every 4 days." />
        <button className="chat-send-btn" onClick={send} disabled={loading}>↑</button>
      </div>
      {followUp && <div className="citation-panel">Clarifying question: {followUp}</div>}
      {sections.map((s) => (
        <div key={s.name} className="citation-panel">
          <div style={{ fontWeight: 700 }}>{s.name} • Confidence {s.confidence}/100</div>
          <div>{s.summary}</div>
          <div className="citation-line">{s.citation}</div>
        </div>
      ))}
      <details className="xai-accordion" open={showWhy}>
        <summary onClick={() => setShowWhy(!showWhy)}>How I Built Your Profile</summary>
        <div className="xai-content">
          <div>Key inputs are extracted from your natural messages and re-audited before saving.</div>
          <div>You can edit anytime in chat, e.g. “Update my data plan to every 5 days.”</div>
        </div>
      </details>
      <div className="feedback-actions">
        <button className="feedback-btn feedback-btn-accept" onClick={() => save(true)}>Accept / Sounds good</button>
        <button className="feedback-btn feedback-btn-disagree" onClick={() => save(false)}>Disagree → Tell me why</button>
      </div>
      <textarea className="feedback-textarea" value={disagreeReason} onChange={(e) => setDisagreeReason(e.target.value)} placeholder="If disagreeing, tell me what to fix" />
      <div className="disclaimer-line">CashWise is an AI advisor. Profile info helps personalization but final decisions are yours.</div>
    </div>
  );
}
