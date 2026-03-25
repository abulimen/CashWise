'use client';

import { useState, useMemo } from 'react';
import { FinancialDashboard } from '@/components/FinancialDashboard';
import { ChatInterface } from '@/components/ChatInterface';
import { TrustScore } from '@/components/TrustScore';
import { AutoStash } from '@/components/AutoStash';
import { TransactionHistory } from '@/components/TransactionHistory';
import { mockFinancialData } from '@/lib/mockData';
import { calculateTrustScore } from '@/lib/trustScore';
import { FinancialData, ChatMessage, AutoStashSuggestion } from '@/lib/types';

export default function Home() {
  const [financialData, setFinancialData] = useState<FinancialData>(mockFinancialData);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAutoStash, setShowAutoStash] = useState(true);

  // Real trust score calculated from financial data
  const trustScore = useMemo(() => calculateTrustScore(financialData), [financialData]);

  // Auto-stash suggestion
  const autoStashSuggestion: AutoStashSuggestion = {
    incomingAmount: 5000,
    suggestedSavings: 1500,
    reasoning: 'Based on your goal of ₦50,000 and current savings of ₦16,000, saving 30% of incoming funds keeps you on track',
    savingsGoal: 50000,
    currentSavings: 16000,
  };

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
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
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
        </div>

        <FinancialDashboard data={financialData} />

        <TrustScore result={trustScore} />

        {showAutoStash && (
          <AutoStash
            suggestion={autoStashSuggestion}
            onAccept={handleAutoStashAccept}
            onDecline={handleAutoStashDecline}
          />
        )}

        <TransactionHistory transactions={financialData.transactions} />
      </div>

      {/* Right Panel — Chat */}
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
