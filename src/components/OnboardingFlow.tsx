'use client';

import { useState } from 'react';
import { Send, BrainCircuit, ShieldAlert, Edit3 } from 'lucide-react';

interface OnboardingFlowProps {
  onCompleted: () => void;
  onSkip?: () => void;
}

export function OnboardingFlow({ onCompleted, onSkip }: OnboardingFlowProps) {
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
  const [conversationHistory, setConversationHistory] = useState<Array<{ question: string; answer: string }>>([]);

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
    const activePrompt = wasAwaitingFollowUp ? (followUp || QUESTIONS[questionIndex]) : QUESTIONS[questionIndex];
    const nextHistory = [
      ...conversationHistory,
      { question: activePrompt, answer: input.trim() },
    ];
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
          conversationHistory: nextHistory,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setConversationHistory(nextHistory);
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
      <div className="onboarding-hero-card">
        <div className="onboarding-hero-icon-wrapper">
          <BrainCircuit size={40} />
        </div>
        <h1 className="onboarding-hero-title">Set Up My Financial Brain</h1>
        <p className="onboarding-hero-subtitle">
          To give you accurate advice, I&apos;ll ask about your income, expenses, goals, and habits. This info stays encrypted and is only used for your profile. You can delete or update anything anytime.
        </p>
        <div className="onboarding-hero-actions">
          <button className="btn btn-primary" onClick={async () => { await fetch('/api/onboarding/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentGiven: true }) }); setConsent(true); }}>
            Start Onboarding
          </button>
          <button className="btn btn-onboarding-skip" onClick={() => {
            if (onSkip) {
              onSkip();
              return;
            }
            setConsent(true);
          }}>
            Skip for now
          </button>
        </div>
        <button className="btn-ghost" onClick={openReview} style={{ marginTop: '24px', fontSize: 13 }}>
          Review & Delete My Profile Data
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-chat-area">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrainCircuit size={24} className="text-primary" style={{ color: 'var(--color-primary)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversational Builder</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Step {questionIndex + 1} of {QUESTIONS.length}</div>
          </div>
        </div>
        {onSkip && (
          <button 
            onClick={onSkip}
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            Skip
          </button>
        )}
      </div>

      {!readyForReview ? (
        <div className="onboarding-question-bubble">
          {awaitingFollowUp ? followUp || QUESTIONS[questionIndex] : QUESTIONS[questionIndex]}
        </div>
      ) : (
        <div className="onboarding-question-bubble">
          Profile draft complete. Review the extracted sections below before accepting.
        </div>
      )}

      {followUp && !readyForReview && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Edit3 size={14} /> Clarification needed
        </div>
      )}

      <div className="onboarding-input-bar">
        <input
          className="onboarding-input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={awaitingFollowUp ? 'Answer the clarifying question...' : 'Type your answer naturally...'}
          disabled={readyForReview}
          autoFocus
        />
        <button className="onboarding-send-btn" onClick={send} disabled={loading || readyForReview || !input.trim()}>
          <Send size={18} />
        </button>
      </div>

      {!readyForReview && sections.some((s) => s.confidence < 30) && (
        <div style={{ fontSize: 12, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-8px' }}>
          <ShieldAlert size={14} /> Draft profile is awaiting clarification
        </div>
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
