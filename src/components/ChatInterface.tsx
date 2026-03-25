'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { RecommendationCard } from '@/components/RecommendationCard';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  'Can I afford ₦12,000 headphones?',
  'I want to buy food for ₦1,500, is that okay?',
  'Should I save more this month?',
  'How is my spending this week?',
];

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
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

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-title">AI Financial Copilot</span>
        <span className="chat-status">
          <span className="chat-status-dot" />
          Online
        </span>
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
                  {msg.recommendation && (
                    <RecommendationCard recommendation={msg.recommendation} />
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
    </div>
  );
}
