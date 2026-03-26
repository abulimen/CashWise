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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false);
  const [readyForReview, setReadyForReview] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [disagreeReason, setDisagreeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [savedProfile, setSavedProfile] = useState<Record<string, unknown> | null>(null);
  const [savedExists, setSavedExists] = useState(false);

  const QUESTIONS = [
    'How does your allowance/income usually come in? (frequency + range + installment style)',
    'What fixed monthly expenses should I always reserve for? (e.g., Spotify, subscriptions)',
    'What variable recurring expenses do you have and how often? (e.g., data every 3-5 days)',
    'What are your top savings goals and priorities right now?',
    'Any spending habits you want me to help with? (impulsive buying, betting, etc.)',
  ];

  const displaySections = sections.filter((s) => readyForReview || s.confidence >= 30);

  const openReview = async () => {
    const response = await fetch('/api/onboarding/profile');
    if (!response.ok) return;
    const data = await response.json();
    setSavedExists(Boolean(data?.exists));
    setSavedProfile((data?.profileDraft || null) as Record<string, unknown> | null);
    setReviewOpen(true);
  };

  const send = async () => {
    if (!input.trim()) return;
    const wasAwaitingFollowUp = awaitingFollowUp;
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          profileDraft: draft,
          questionIndex,
          activeQuestion: QUESTIONS[questionIndex],
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setDraft(data.profileDraft || {});
      setSections(data.sections || []);
      const nextFollowUp = String(data.followUpQuestion || '').trim();

      // Loop guard: after a user answers one follow-up for a question, always advance.
      if (wasAwaitingFollowUp) {
        setFollowUp('');
        setAwaitingFollowUp(false);
        setQuestionIndex((prev) => {
          const next = prev + 1;
          if (next >= QUESTIONS.length) {
            setReadyForReview(true);
            return prev;
          }
          return next;
        });
      } else if (nextFollowUp) {
        setFollowUp(nextFollowUp);
        setAwaitingFollowUp(true);
      } else {
        setFollowUp('');
        setAwaitingFollowUp(false);
        setQuestionIndex((prev) => {
          const next = prev + 1;
          if (next >= QUESTIONS.length) {
            setReadyForReview(true);
            return prev;
          }
          return next;
        });
      }
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
        <button className="feedback-btn feedback-btn-disagree" onClick={openReview} style={{ marginTop: 'var(--space-3)' }}>
          Review & Delete My Profile Data
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="recommendation-section-title">Conversational Profile Builder</div>
      {!readyForReview ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {awaitingFollowUp
            ? `Follow-up for Question ${questionIndex + 1} of ${QUESTIONS.length}: ${followUp || QUESTIONS[questionIndex]}`
            : `Question ${questionIndex + 1} of ${QUESTIONS.length}: ${QUESTIONS[questionIndex]}`}
        </p>
      ) : (
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Profile draft complete. Review the extracted sections below before accepting.
        </p>
      )}
      <div className="chat-input-wrapper">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={awaitingFollowUp ? 'Answer the clarifying question naturally' : 'Type your answer naturally'}
          disabled={readyForReview}
        />
        <button className="chat-send-btn" onClick={send} disabled={loading || readyForReview}>↑</button>
      </div>
      {followUp && !readyForReview && <div className="citation-panel">Clarifying question: {followUp}</div>}
      {!readyForReview && sections.some((s) => s.confidence < 30) && (
        <div className="citation-line">Draft profile is awaiting clarification before confidence is shown.</div>
      )}
      {displaySections.map((s) => (
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
        <button className="feedback-btn feedback-btn-accept" onClick={() => save(true)} disabled={!readyForReview}>Accept / Sounds good</button>
        <button className="feedback-btn feedback-btn-disagree" onClick={() => save(false)} disabled={!readyForReview}>Disagree → Tell me why</button>
      </div>
      <button className="feedback-btn feedback-btn-disagree" onClick={openReview}>
        Review & Delete My Profile Data
      </button>
      <textarea className="feedback-textarea" value={disagreeReason} onChange={(e) => setDisagreeReason(e.target.value)} placeholder="If disagreeing, tell me what to fix" />
      <div className="disclaimer-line">CashWise is an AI advisor. Profile info helps personalization but final decisions are yours.</div>

      {reviewOpen && (
        <div className="consent-overlay" role="dialog" aria-modal="true">
          <div className="consent-modal glass-card">
            <div className="consent-title">Stored Profile Data</div>
            {!savedExists ? (
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>No saved profile data found.</p>
            ) : (
              <pre style={{ maxHeight: 260, overflow: 'auto', fontSize: '12px', marginBottom: 'var(--space-4)' }}>
                {JSON.stringify(savedProfile, null, 2)}
              </pre>
            )}
            <div className="consent-actions">
              <button
                className="consent-btn consent-btn-cancel"
                onClick={async () => {
                  await fetch('/api/onboarding/profile', { method: 'DELETE' });
                  setSavedProfile(null);
                  setSavedExists(false);
                }}
              >
                Delete My Profile Data
              </button>
              <button className="consent-btn consent-btn-allow" onClick={() => setReviewOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
