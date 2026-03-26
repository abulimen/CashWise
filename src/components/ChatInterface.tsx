'use client';

import { useState, useRef, useCallback } from 'react';
import { ChatMessage } from '@/lib/types';
import { RecommendationCard } from '@/components/RecommendationCard';
import { MessageSquare, Send } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onSubmitFeedback: (payload: {
    query: string;
    aiSuggestion: string;
    explanation: string;
    actionType: 'Chat' | 'Auto-Stash';
    confidence: number;
  }) => void;
}

const SUGGESTIONS = [
  'Can I afford ₦12,000 headphones?',
  'I want to buy food for ₦1,500, is that okay?',
  'Should I save more this month?',
  'How is my spending this week?',
];

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  onRefresh,
  onSubmitFeedback,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [activeCitations, setActiveCitations] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<ChatMessage | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('My spending is usually lower');
  const [feedbackText, setFeedbackText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSendMessage(text);
    setTimeout(scrollToBottom, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const confidenceClass = (score: number) =>
    score >= 90 ? 'confidence-good' : score >= 70 ? 'confidence-mid' : 'confidence-low';

  const hasAdvice = (msg: ChatMessage) =>
    Boolean(msg.recommendation || /\d/.test(msg.content));

  const hasPendingUpdate = (msg: ChatMessage) =>
    Boolean(msg.pendingProfileUpdate?.token);

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-screen">
      {/* Header */}
      <div className="chat-top-bar">
        <div>
          <div className="chat-top-title">AI Financial Copilot</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="chat-online">
            <span className="chat-online-dot" />
            Online
          </div>
          <button className="refresh-btn refresh-btn-small" onClick={onRefresh} id="chat-refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {isEmpty ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon"><MessageSquare size={48} /></div>
            <div className="chat-welcome-title">Ask me anything about your money</div>
            <div className="chat-welcome-sub">
              I&apos;ll show you exactly how a purchase affects your budget — with clear reasoning you can check yourself.
            </div>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chat-suggestion-btn" onClick={() => onSendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`msg msg-${msg.role}`}>
              <div className="msg-bubble">
                {msg.content}

                {/* Confidence badge */}
                {typeof msg.confidenceScore === 'number' && hasAdvice(msg) && (
                  <button
                    className={`confidence-badge ${confidenceClass(msg.confidenceScore)}`}
                    onClick={() => setActiveCitations(activeCitations === msg.id ? null : msg.id)}
                  >
                    Confidence: {msg.confidenceScore}/100
                  </button>
                )}

                {/* Citations panel */}
                {activeCitations === msg.id && (
                  <div className="citation-panel">
                    {(msg.citations || []).map((c) => (
                      <div key={c.txId} className="citation-line">
                        {c.txId} • {new Date(c.date).toLocaleDateString('en-NG')} • ₦{c.amount.toLocaleString('en-NG')} • {c.category}
                      </div>
                    ))}
                  </div>
                )}

                {/* Decision card */}
                {msg.recommendation && <RecommendationCard recommendation={msg.recommendation} />}

                {/* XAI accordion */}
                {msg.role === 'assistant' && (
                  <details className="xai-accordion">
                    <summary>Why I said this</summary>
                    <div className="xai-content">
                      <div className="xai-heading">Data used</div>
                      {(msg.citations || []).map((c) => (
                        <div key={`xai-${c.txId}`} className="citation-line">
                          {c.description} (₦{c.amount.toLocaleString('en-NG')}, {c.category}, {new Date(c.date).toLocaleDateString('en-NG')})
                        </div>
                      ))}
                      <div className="xai-heading">Reasoning trace</div>
                      <div>{msg.reasoningTrace || 'Checked recent cash flow, upcoming bills, and goals.'}</div>
                      <div className="xai-heading">Prompt rule used</div>
                      <div>{msg.usedPromptSnippet || 'Start with a clear Yes/No. Never make up numbers.'}</div>
                    </div>
                  </details>
                )}

                {/* Feedback buttons */}
                {hasAdvice(msg) && msg.role === 'assistant' && (
                  <div className="feedback-actions">
                    <button
                      className="feedback-btn feedback-btn-accept"
                      onClick={() => onSubmitFeedback({
                        query: messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '',
                        aiSuggestion: msg.content,
                        explanation: 'Accepted / Sounds good',
                        actionType: 'Chat',
                        confidence: msg.confidenceScore || 0,
                      })}
                    >Accept / Sounds good</button>
                    <button
                      className="feedback-btn feedback-btn-disagree"
                      onClick={() => setFeedbackTarget(msg)}
                    >Disagree → Tell me why</button>
                  </div>
                )}

                {/* Profile update confirmation */}
                {msg.role === 'assistant' && hasPendingUpdate(msg) && (
                  <div className="feedback-actions">
                    <button
                      className="feedback-btn feedback-btn-accept"
                      onClick={() => onSendMessage(`/confirm-profile-update ${msg.pendingProfileUpdate?.token || ''}`)}
                    >Confirm update</button>
                    <button
                      className="feedback-btn feedback-btn-disagree"
                      onClick={() => onSendMessage('Cancel that profile update.')}
                    >Cancel</button>
                  </div>
                )}
              </div>
              <span className="msg-time">{formatTime(msg.timestamp)}</span>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="msg msg-assistant">
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <input
            ref={inputRef}
            className="chat-input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask about a purchase, e.g. "Can I afford ₦12k headphones?"'
            disabled={isLoading}
            id="chat-input"
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            id="chat-send-btn"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="disclaimer-line">CashWise is an AI advisor. We take no liability for financial decisions.</div>
      </div>

      {/* Disagree modal */}
      {feedbackTarget && (
        <div className="consent-overlay" role="dialog" aria-modal="true">
          <div className="consent-modal">
            <div className="consent-title">Why do you disagree?</div>
            <div className="feedback-chip-wrap">
              {['My spending is usually lower', 'I have extra cash coming', "This goal isn't priority anymore", 'Other'].map((c) => (
                <button
                  key={c}
                  className={`feedback-chip ${feedbackReason === c ? 'active' : ''}`}
                  onClick={() => setFeedbackReason(c)}
                >{c}</button>
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
                  const explanation = feedbackReason === 'Other'
                    ? feedbackText.trim()
                    : `${feedbackReason}${feedbackText ? `: ${feedbackText.trim()}` : ''}`;
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
              >Submit</button>
              <button className="consent-btn consent-btn-cancel" onClick={() => setFeedbackTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
