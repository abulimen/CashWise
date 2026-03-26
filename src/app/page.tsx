'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { HomeScreen } from '@/components/HomeScreen';
import { StashScreen } from '@/components/StashScreen';
import { AuditScreen } from '@/components/AuditScreen';
import { BillsScreen } from '@/components/BillsScreen';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { BottomNav, Sidebar } from '@/components/Nav';
import { FinancialData, ChatMessage, AutoStashSuggestion } from '@/lib/types';
import { encryptWithDekBase64, generateDekBase64 } from '@/lib/secureCache';
import { detectNewBulkInflow } from '@/lib/inflowDetection';

type Screen = 'home' | 'copilot' | 'stash' | 'bills' | 'profile' | 'audit';

const DEFAULT_FIN_DATA: FinancialData = {
  balance: 0,
  currency: '₦',
  daysRemaining: 1,
  dailyBudget: 0,
  averageDailySpending: 0,
  savingsGoal: 0,
  currentSavings: 0,
  savingsGoalTitle: undefined,
  transactions: [],
  lastUpdated: new Date().toISOString(),
};

export default function Home() {
  const appUserId = process.env.NEXT_PUBLIC_CASHWISE_DEMO_USER_ID || '';
  const [screen, setScreen] = useState<Screen>('home');
  const [financialData, setFinancialData] = useState<FinancialData>(DEFAULT_FIN_DATA);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAutoStash, setShowAutoStash] = useState(false);
  const [autoStashAdvice, setAutoStashAdvice] = useState<Partial<AutoStashSuggestion>>({});
  const [auditRows, setAuditRows] = useState<Array<{ timestamp: string; action: string; suggestion: string; user_decision: string; confidence: number }>>([]);
  const [bills, setBills] = useState<Array<{ id: string; name: string; amount: number; dueDate: string; status: string }>>([]);
  const [bulkInflowMinAmount, setBulkInflowMinAmount] = useState(10000);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // default true — only show if API says otherwise
  const [aiSnippet, setAiSnippet] = useState<string | undefined>();
  const financialDataRef = useRef(financialData);

  useEffect(() => { financialDataRef.current = financialData; }, [financialData]);

  // ── Auto-stash suggestion calculation ──
  const autoStashSuggestion: AutoStashSuggestion = useMemo(() => {
    const inflow = detectNewBulkInflow(financialData, bulkInflowMinAmount);
    const incoming = inflow.incomingAmount;
    const saving = incoming > 0 ? Math.max(0, Math.round(incoming * 0.3)) : 0;
    return {
      incomingAmount: incoming,
      suggestedSavings: saving,
      reasoning: 'Based on your latest inflow and active savings goal.',
      savingsGoal: financialData.savingsGoal,
      currentSavings: financialData.currentSavings,
    };
  }, [financialData, bulkInflowMinAmount]);

  // ── Encrypted cache init ──
  const initEncryptedCache = useCallback(async () => {
    if (!appUserId) return;
    try {
      const dekBase64 = await generateDekBase64();
      const encrypted = await encryptWithDekBase64(financialDataRef.current, dekBase64);
      await fetch('/api/transactions/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: appUserId, encryptedBlob: encrypted.encryptedBlob, iv: encrypted.iv, dekBase64 }),
      });
    } catch { /* silent — cache is best-effort */ }
  }, [appUserId]);

  // ── Refresh financial data ──
  const refreshFinancialData = useCallback(async (force: boolean) => {
    if (!appUserId) return;
    try {
      const params = new URLSearchParams({ userId: appUserId, consent: 'allow', force: force ? 'true' : 'false' });
      const res = await fetch(`/api/financial-data?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.data) setFinancialData(data.data as FinancialData);
    } catch { /* silent */ }
  }, [appUserId]);

  // ── Load audit trail ──
  const loadAuditTrail = useCallback(async () => {
    if (!appUserId) return;
    try {
      const res = await fetch(`/api/audit?userId=${encodeURIComponent(appUserId)}`);
      if (!res.ok) return;
      const data = await res.json();
      setAuditRows(data.rows || []);
    } catch { /* silent */ }
  }, [appUserId]);

  const loadBills = useCallback(async () => {
    if (!appUserId) return;
    try {
      const res = await fetch('/api/bills');
      if (!res.ok) return;
      const data = await res.json();
      setBills(data.bills || []);
    } catch {
      // silent
    }
  }, [appUserId]);

  // ── Load settings ──
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      setBulkInflowMinAmount(Number(data.bulkInflowMinAmount || 10000));
    } catch { /* silent */ }
  }, []);

  // ── Load onboarding state ──
  const loadOnboardingState = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/profile');
      if (!res.ok) return;
      const data = await res.json();
      setOnboardingCompleted(Boolean(data?.onboardingCompleted));
    } catch { /* silent — default to completed so we don't block UI */ }
  }, []);

  // ── Load auto-stash AI advice ──
  useEffect(() => {
    if (autoStashSuggestion.incomingAmount <= 0) return;
    const load = async () => {
      try {
        const res = await fetch('/api/auto-stash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incomingAmount: autoStashSuggestion.incomingAmount,
            suggestedSavings: autoStashSuggestion.suggestedSavings,
            financialData,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setShowAutoStash(Boolean(data?.shouldSuggest));
        setAutoStashAdvice({
          reasoning: data?.adviceMeta?.suggestion || data.message || autoStashSuggestion.reasoning,
          confidenceScore: data.confidenceScore,
          citations: data.citations,
          reasoningTrace: data.reasoningTrace,
          usedPromptSnippet: data.usedPromptSnippet,
        });
      } catch { setShowAutoStash(false); }
    };
    load();
  }, [financialData, autoStashSuggestion.incomingAmount, autoStashSuggestion.suggestedSavings, autoStashSuggestion.reasoning]);

  // ── Boot ──
  useEffect(() => {
    const shouldInit = typeof window !== 'undefined' && !window.localStorage.getItem('cw_cache_initialized');
    if (shouldInit) {
      initEncryptedCache().finally(() => window.localStorage.setItem('cw_cache_initialized', 'true'));
    }
    loadSettings();
    loadOnboardingState();
    loadBills();
    refreshFinancialData(false);
    const interval = window.setInterval(() => refreshFinancialData(false), 120_000);
    return () => window.clearInterval(interval);
  }, [initEncryptedCache, refreshFinancialData, loadSettings, loadOnboardingState, loadBills]);

  useEffect(() => {
    if (screen === 'audit') loadAuditTrail();
  }, [screen, loadAuditTrail]);

  // ── Chat ──
  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, financialData, conversationHistory: messages }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
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
        pendingProfileUpdate: data.pendingProfileUpdate,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Surface last short AI insight on home screen
      if (data.message && data.message.length < 120) setAiSnippet(data.message);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg_${Date.now()}_err`, role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auto-stash accept/decline ──
  const handleAutoStashAccept = () => {
    setFinancialData((prev) => ({
      ...prev,
      balance: prev.balance - autoStashSuggestion.suggestedSavings,
      currentSavings: prev.currentSavings + autoStashSuggestion.suggestedSavings,
      dailyBudget: Math.round((prev.balance - autoStashSuggestion.suggestedSavings) / prev.daysRemaining),
    }));
    setShowAutoStash(false);
  };
  const handleAutoStashDecline = () => setShowAutoStash(false);

  // ── Feedback ──
  const submitFeedback = async (payload: { query: string; aiSuggestion: string; explanation: string; actionType: 'Chat' | 'Auto-Stash'; confidence: number }) => {
    if (!appUserId) return;
    try {
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
    } catch { /* silent */ }
  };

  const mergedAutoStash = { ...autoStashSuggestion, ...autoStashAdvice };

  // ── Render active screen ──
  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            financialData={financialData}
            onNavigate={setScreen}
            aiSnippet={aiSnippet}
          />
        );
      case 'copilot':
        return (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onRefresh={() => refreshFinancialData(true)}
            onSubmitFeedback={submitFeedback}
          />
        );
      case 'stash':
        return (
          <StashScreen
            financialData={financialData}
            showAutoStash={showAutoStash}
            autoStashSuggestion={mergedAutoStash as AutoStashSuggestion}
            onAutoStashAccept={handleAutoStashAccept}
            onAutoStashDecline={handleAutoStashDecline}
            onAutoStashFeedback={(explanation) =>
              submitFeedback({
                query: 'Auto-Stash proposal',
                aiSuggestion: mergedAutoStash.reasoning || '',
                explanation,
                actionType: 'Auto-Stash',
                confidence: mergedAutoStash.confidenceScore || 0,
              })
            }
          />
        );
      case 'profile':
        return (
          <div className="screen">
            <div className="top-bar">
              <div>
                <div className="top-bar-greeting">Personalize your AI</div>
                <div className="top-bar-name">Profile Setup</div>
              </div>
            </div>
            <div style={{ padding: '0 16px' }}>
              <OnboardingFlow onCompleted={() => setOnboardingCompleted(true)} />
            </div>
          </div>
        );
      case 'bills':
        return <BillsScreen bills={bills} />;
      case 'audit':
        return (
          <AuditScreen
            rows={auditRows}
            onRefresh={loadAuditTrail}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar active={screen} onNavigate={setScreen} />
      <main className="app-main">
        {renderScreen()}
      </main>
      <BottomNav active={screen} onNavigate={setScreen} />
    </div>
  );
}
