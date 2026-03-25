'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FinancialDashboard } from '@/components/FinancialDashboard';
import { ChatInterface } from '@/components/ChatInterface';
import { TrustScore } from '@/components/TrustScore';
import { AutoStash } from '@/components/AutoStash';
import { TransactionHistory } from '@/components/TransactionHistory';
import { ConsentModal } from '@/components/ConsentModal';
import { calculateTrustScore } from '@/lib/trustScore';
import { FinancialData, ChatMessage, AutoStashSuggestion } from '@/lib/types';
import { encryptWithDekBase64, generateDekBase64 } from '@/lib/secureCache';
import { detectNewBulkInflow } from '@/lib/inflowDetection';

export default function Home() {
  const appUserId = process.env.NEXT_PUBLIC_CASHWISE_DEMO_USER_ID || '';
  const [financialData, setFinancialData] = useState<FinancialData>({
    balance: 0,
    currency: '₦',
    daysRemaining: 1,
    dailyBudget: 0,
    averageDailySpending: 0,
    savingsGoal: 0,
    currentSavings: 0,
    transactions: [],
    lastUpdated: new Date().toISOString(),
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAutoStash, setShowAutoStash] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [pendingRefresh, setPendingRefresh] = useState<{ force: boolean; background: boolean } | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'audit'>('home');
  const [auditRows, setAuditRows] = useState<Array<{ timestamp: string; action: string; suggestion: string; user_decision: string; confidence: number }>>([]);

  // Real trust score calculated from financial data
  const trustScore = useMemo(() => calculateTrustScore(financialData), [financialData]);

  // Auto-stash suggestion
  const autoStashSuggestion: AutoStashSuggestion = useMemo(() => {
    const inflow = detectNewBulkInflow(financialData);
    const incomingAmount = inflow.incomingAmount;
    const suggestedSavings = incomingAmount > 0 ? Math.max(0, Math.round(incomingAmount * 0.3)) : 0;
    return {
      incomingAmount,
      suggestedSavings,
      reasoning: 'Evaluating your latest confirmed inflow and active goals from Supabase data.',
      savingsGoal: financialData.savingsGoal,
      currentSavings: financialData.currentSavings,
    };
  }, [financialData]);

  const [autoStashAdvice, setAutoStashAdvice] = useState<Partial<AutoStashSuggestion>>({});

  const initEncryptedCache = async () => {
    if (!appUserId) return;
    const dekBase64 = await generateDekBase64();
    const encrypted = await encryptWithDekBase64(financialData, dekBase64);
    await fetch('/api/transactions/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: appUserId,
        encryptedBlob: encrypted.encryptedBlob,
        iv: encrypted.iv,
        dekBase64,
      }),
    });
  };

  const refreshFinancialData = useCallback(async (force: boolean) => {
    if (!appUserId) return;
    const params = new URLSearchParams({
      userId: appUserId,
      consent: 'allow',
      force: force ? 'true' : 'false',
    });
    const response = await fetch(`/api/financial-data?${params.toString()}`);
    if (!response.ok) return;
    const data = await response.json();
    if (data?.data) {
      setFinancialData(data.data as FinancialData);
    }
  }, [appUserId]);

  const requestConsentForPull = useCallback((force: boolean, background = false) => {
    setPendingRefresh({ force, background });
    setConsentOpen(true);
  }, []);

  const loadAuditTrail = useCallback(async () => {
    if (!appUserId) return;
    const response = await fetch(`/api/audit?userId=${encodeURIComponent(appUserId)}`);
    if (!response.ok) return;
    const data = await response.json();
    setAuditRows(data.rows || []);
  }, [appUserId]);

  useEffect(() => {
    requestConsentForPull(false, false);
    const interval = window.setInterval(() => {
      requestConsentForPull(false, true);
    }, 120000);
    return () => window.clearInterval(interval);
  }, [requestConsentForPull]);

  useEffect(() => {
    if (activeView === 'audit') {
      loadAuditTrail();
    }
  }, [activeView, loadAuditTrail]);

  useEffect(() => {
    const loadAutoStashAdvice = async () => {
      try {
        const response = await fetch('/api/auto-stash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incomingAmount: autoStashSuggestion.incomingAmount,
            suggestedSavings: autoStashSuggestion.suggestedSavings,
            financialData,
          }),
        });
        if (!response.ok) return;
        const data = await response.json();
        const shouldSuggest = Boolean(data?.shouldSuggest);
        setShowAutoStash(shouldSuggest);
        setAutoStashAdvice({
          reasoning: data?.adviceMeta?.suggestion || data.message || autoStashSuggestion.reasoning,
          confidenceScore: data.confidenceScore,
          citations: data.citations,
          reasoningTrace: data.reasoningTrace,
          usedPromptSnippet: data.usedPromptSnippet,
        });
      } catch {
        // Keep default suggestion reasoning when AI is unavailable.
        setShowAutoStash(false);
      }
    };
    loadAutoStashAdvice();
  }, [financialData, autoStashSuggestion.incomingAmount, autoStashSuggestion.reasoning, autoStashSuggestion.suggestedSavings]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          financialData,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        recommendation: data.recommendation,
        confidenceScore: data.confidenceScore,
        citations: data.citations,
        reasoningTrace: data.reasoningTrace,
        usedPromptSnippet: data.usedPromptSnippet,
        adviceMeta: data.adviceMeta,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      // Fallback response if API fails
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoStashAccept = () => {
    setFinancialData(prev => ({
      ...prev,
      balance: prev.balance - autoStashSuggestion.suggestedSavings,
      currentSavings: prev.currentSavings + autoStashSuggestion.suggestedSavings,
      dailyBudget: Math.round((prev.balance - autoStashSuggestion.suggestedSavings) / prev.daysRemaining),
    }));
    setShowAutoStash(false);
  };

  const handleAutoStashDecline = () => {
    setShowAutoStash(false);
  };

  const submitFeedback = async (payload: { query: string; aiSuggestion: string; explanation: string; actionType: 'Chat' | 'Auto-Stash'; confidence: number }) => {
    if (!appUserId) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: appUserId,
        query: payload.query,
        aiSuggestion: payload.aiSuggestion,
        userExplanation: payload.explanation,
        actionType: payload.actionType,
        confidence: payload.confidence,
      }),
    });
  };

  return (
    <div className="app-layout">
      {/* Left Panel — Dashboard */}
      <div className="dashboard-panel">
        <div className="app-header">
          <div className="app-logo">C</div>
          <div>
            <div className="app-title">CashWise</div>
            <div className="app-tagline">AI you can trust with your money</div>
          </div>
          <button className="refresh-btn refresh-btn-small" onClick={() => setActiveView('home')}>Home</button>
          <button className="refresh-btn refresh-btn-small" onClick={() => setActiveView('audit')}>AI Audit Trail</button>
          <button className="refresh-btn" onClick={() => requestConsentForPull(true, false)}>
            Refresh
          </button>
        </div>

        {activeView === 'home' ? (
          <>
            <FinancialDashboard data={financialData} />

            <TrustScore result={trustScore} />

            {showAutoStash && (
              <AutoStash
                suggestion={{ ...autoStashSuggestion, ...autoStashAdvice }}
                onAccept={handleAutoStashAccept}
                onDecline={handleAutoStashDecline}
                onSubmitFeedback={(explanation) => {
                  submitFeedback({
                    query: 'Auto-Stash proposal',
                    aiSuggestion: autoStashAdvice.reasoning || autoStashSuggestion.reasoning,
                    explanation,
                    actionType: 'Auto-Stash',
                    confidence: autoStashAdvice.confidenceScore || 0,
                  });
                }}
              />
            )}

            <TransactionHistory transactions={financialData.transactions} />
          </>
        ) : (
          <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
            <div className="recommendation-section-title" style={{ marginBottom: 'var(--space-3)' }}>AI Audit Trail</div>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Suggestion</th>
                  <th>User Decision</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((row) => (
                  <tr key={`${row.timestamp}-${row.action}`}>
                    <td>{new Date(row.timestamp).toLocaleString('en-NG')}</td>
                    <td>{row.action}</td>
                    <td>{row.suggestion}</td>
                    <td>{row.user_decision}</td>
                    <td>{row.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="disclaimer-line">CashWise is an AI advisor. We take no liability for financial decisions.</div>
          </div>
        )}
      </div>

      {/* Right Panel — Chat */}
      {activeView === 'home' ? (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onRefresh={() => requestConsentForPull(true, false)}
          onSubmitFeedback={submitFeedback}
        />
      ) : (
        <div className="chat-panel">
          <div className="chat-header"><span className="chat-title">AI Audit Trail</span></div>
          <div className="chat-messages">
            <p style={{ color: 'var(--color-text-secondary)' }}>Audit records for this week are shown on the left panel.</p>
            <div className="disclaimer-line">CashWise is an AI advisor. We take no liability for financial decisions.</div>
          </div>
        </div>
      )}

      <ConsentModal
        open={consentOpen}
        onAllow={async () => {
          setConsentOpen(false);
          const shouldInit = typeof window !== 'undefined' && !window.localStorage.getItem('cw_cache_initialized');
          if (shouldInit) {
            await initEncryptedCache();
            window.localStorage.setItem('cw_cache_initialized', 'true');
          }
          if (pendingRefresh) {
            await refreshFinancialData(pendingRefresh.force);
            setPendingRefresh(null);
          }
        }}
        onCancel={() => {
          setConsentOpen(false);
          setPendingRefresh(null);
        }}
      />
    </div>
  );
}
