'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { RecommendationCard } from '@/components/RecommendationCard';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onSubmitFeedback: (payload: { query: string; aiSuggestion: string; explanation: string; actionType: 'Chat' | 'Auto-Stash'; confidence: number }) => void;
}

const SUGGESTIONS = [
  'Can I afford ₦12,000 headphones?',
  'I want to buy food for ₦1,500, is that okay?',
  'Should I save more this month?',
  'How is my spending this week?',
];

export function ChatInterface({ messages, onSendMessage, isLoading, onRefresh, onSubmitFeedback }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [activeCitations, setActiveCitations] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<ChatMessage | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('My spending is usually lower');
  const [feedbackText, setFeedbackText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const confidenceClass = (score: number) => {
    if (score >= 90) return 'confidence-good';
    if (score >= 70) return 'confidence-mid';
    return 'confidence-low';
  };

  const hasAdvice = (msg: ChatMessage) => Boolean(msg.recommendation || /\d/.test(msg.content));

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-title">AI Financial Copilot</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="chat-status">
            <span className="chat-status-dot" />
            Online
          </span>
          <button className="refresh-btn refresh-btn-small" onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-icon">💬</div>
            <h2 className="welcome-title">Ask me anything about your money</h2>
            <p className="welcome-subtitle">
              I&apos;ll show you exactly how a purchase affects your budget — with clear reasoning you can check yourself.
            </p>
            <div className="welcome-suggestions">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  className="suggestion-btn"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-bubble">
                  {msg.content}
                  {typeof msg.confidenceScore === 'number' && hasAdvice(msg) && (
                    <button
                      className={`confidence-badge ${confidenceClass(msg.confidenceScore)}`}
                      onClick={() => setActiveCitations(activeCitations === msg.id ? null : msg.id)}
                    >
                      Confidence: {msg.confidenceScore}/100
                    </button>
                  )}
                  {activeCitations === msg.id && (
                    <div className="citation-panel">
                      {(msg.citations || []).map((citation) => (
                        <div key={citation.txId} className="citation-line">
                          {citation.txId} • {new Date(citation.date).toLocaleDateString('en-NG')} • ₦{citation.amount.toLocaleString('en-NG')} • {citation.category}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.recommendation && (
                    <RecommendationCard recommendation={msg.recommendation} />
                  )}
                  {hasAdvice(msg) && msg.role === 'assistant' && (
                    <div className="feedback-actions">
                      <button
                        className="feedback-btn feedback-btn-accept"
                        onClick={() => {
                          onSubmitFeedback({
                            query: messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '',
                            aiSuggestion: msg.content,
                            explanation: 'Accepted / Sounds good',
                            actionType: 'Chat',
                            confidence: msg.confidenceScore || 0,
                          });
                        }}
                      >
                        Accept / Sounds good
                      </button>
                      <button className="feedback-btn feedback-btn-disagree" onClick={() => setFeedbackTarget(msg)}>Disagree → Tell me why</button>
                    </div>
                  )}
                  {msg.role === 'assistant' && (
                    <details className="xai-accordion">
                      <summary>Why I said this</summary>
                      <div className="xai-content">
                        <div className="xai-heading">Data used</div>
                        {(msg.citations || []).map((citation) => (
                          <div key={`why-${citation.txId}`} className="citation-line">
                            {citation.description} (₦{citation.amount.toLocaleString('en-NG')}, {citation.category}, {new Date(citation.date).toLocaleDateString('en-NG')})
                          </div>
                        ))}
                        <div className="xai-heading">Reasoning trace</div>
                        <div>{msg.reasoningTrace || 'Checked recent cash flow, upcoming bills, and goals.'}</div>
                        <div className="xai-heading">Prompt rule snippet</div>
                        <div>{msg.usedPromptSnippet || 'Start with a clear Yes/No. Never make up numbers.'}</div>
                      </div>
                    </details>
                  )}
                </div>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
            ))}
            {isLoading && (
              <div className="message message-assistant">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Ask about a purchase, e.g. &quot;Can I afford ₦12k headphones?&quot;"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            id="chat-input"
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || isLoading}
            id="chat-send-btn"
          >
            ↑
          </button>
        </div>
      </form>

      <div className="disclaimer-line">CashWise is an AI advisor. We take no liability for financial decisions.</div>

      {feedbackTarget && (
        <div className="consent-overlay" role="dialog" aria-modal="true">
          <div className="consent-modal glass-card">
            <div className="consent-title">Why do you disagree?</div>
            <div className="feedback-chip-wrap">
              {['My spending is usually lower', 'I have extra cash coming', 'This goal isn’t priority anymore', 'Other'].map((choice) => (
                <button
                  key={choice}
                  className={`feedback-chip ${feedbackReason === choice ? 'active' : ''}`}
                  onClick={() => setFeedbackReason(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
            <textarea
              className="feedback-textarea"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Add your explanation"
            />
            <div className="consent-actions">
              <button
                className="consent-btn consent-btn-allow"
                onClick={() => {
                  const explanation = feedbackReason === 'Other' ? feedbackText.trim() : `${feedbackReason}${feedbackText ? `: ${feedbackText.trim()}` : ''}`;
                  onSubmitFeedback({
                    query: messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '',
                    aiSuggestion: feedbackTarget.content,
                    explanation,
                    actionType: 'Chat',
                    confidence: feedbackTarget.confidenceScore || 0,
                  });
                  setFeedbackTarget(null);
                  setFeedbackText('');
                }}
              >
                Submit
              </button>
              <button className="consent-btn consent-btn-cancel" onClick={() => setFeedbackTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
