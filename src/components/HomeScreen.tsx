'use client';

import { useMemo, useState, useEffect } from 'react';
import { FinancialData } from '@/lib/types';
import { calculateTrustScore } from '@/lib/trustScore';
import { formatNaira } from '@/lib/currency';
import { TransactionHistory } from '@/components/TransactionHistory';
import { TrustScore } from '@/components/TrustScore';

interface HomeScreenProps {
  financialData: FinancialData;
  onNavigate: (screen: 'home' | 'copilot' | 'stash' | 'bills' | 'audit') => void;
  aiSnippet?: string;
}

import { Bell, Plus, ArrowRightLeft, BarChart3, TrendingUp, Calendar, PiggyBank, Sparkles } from 'lucide-react';

export function HomeScreen({ financialData, onNavigate, aiSnippet }: HomeScreenProps) {
  const trustScore = useMemo(() => calculateTrustScore(financialData), [financialData]);
  const [balanceVisible, setBalanceVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBalanceVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const safeToSpend = formatNaira(financialData.dailyBudget * 3);
  const wholeBalance = Math.floor(financialData.balance).toLocaleString('en-NG');

  return (
    <div className="screen">
      {/* Top bar */}
      <div className="top-bar">
        <div>
          <div className="top-bar-greeting">Hello, Student</div>
          <div className="top-bar-name">My Finance</div>
        </div>
        <div className="top-bar-actions">
          <button className="notif-btn" aria-label="Notifications"><Bell size={18} /></button>
          <div className="top-bar-avatar">T</div>
        </div>
      </div>

      {/* Hero balance card */}
      <div className={`balance-hero anim-card-1`} style={{ opacity: balanceVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div className="balance-hero-label">Total Balance</div>
        <div className="balance-hero-amount">
          ₦{wholeBalance}<span className="cents">.00</span>
        </div>
        <div className="safe-to-spend">
          <span className="safe-to-spend-dot" />
          Safe to spend: {safeToSpend}
        </div>
        <div className="balance-hero-actions">
          <button className="hero-action-btn hero-action-btn-primary" onClick={() => onNavigate('stash')}>
            <Plus size={16} /> Add Money
          </button>
          <button className="hero-action-btn hero-action-btn-outline" onClick={() => onNavigate('copilot')}>
            <ArrowRightLeft size={16} /> Transfer
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-row anim-card-2">
        <div className="stat-card">
          <div className="stat-icon-wrap"><BarChart3 size={20} /></div>
          <div className="stat-val">{formatNaira(financialData.dailyBudget)}</div>
          <div className="stat-lbl">Daily Budget</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><TrendingUp size={20} /></div>
          <div className="stat-val">{formatNaira(financialData.averageDailySpending)}</div>
          <div className="stat-lbl">Avg Spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><Calendar size={20} /></div>
          <div className="stat-val">{financialData.daysRemaining}</div>
          <div className="stat-lbl">Days Left</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><PiggyBank size={20} /></div>
          <div className="stat-val">{formatNaira(financialData.currentSavings)}</div>
          <div className="stat-lbl">Saved</div>
        </div>
      </div>

      {/* Desktop two-col layout */}
      <div className="home-grid">
        <div className="home-grid-left">
          {/* Recent Activity */}
          <div className="section-hdr anim-card-3">
            <h2>Recent Activity</h2>
            <button className="section-hdr-action" onClick={() => onNavigate('stash')}>View All</button>
          </div>
          <TransactionHistory transactions={financialData.transactions} />
        </div>

        <div className="home-grid-right anim-card-4">
          {/* Trust Score */}
          <TrustScore result={trustScore} />

          {/* Auto-Stash preview */}
          <div className="autostash-card" style={{ margin: '0 16px' }}>
            <div className="autostash-hdr">
              <div className="autostash-hdr-left">
                <div className="autostash-title">{financialData.savingsGoalTitle || 'Savings Goal'}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700 }}>
                {Math.round((financialData.currentSavings / Math.max(1, financialData.savingsGoal)) * 100)}%
              </div>
            </div>
            <div className="autostash-progress-bar">
              <div
                className="autostash-progress-fill"
                style={{ width: `${Math.min(100, Math.round((financialData.currentSavings / Math.max(1, financialData.savingsGoal)) * 100))}%` }}
              />
            </div>
            <div className="autostash-amounts">
              <div>
                <div className="autostash-saved">{formatNaira(financialData.currentSavings)}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>saved this month</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>
                  {Math.round((financialData.currentSavings / Math.max(1, financialData.savingsGoal)) * 100)}% Achieved
                </div>
                <div className="autostash-goal">of {formatNaira(financialData.savingsGoal)} goal</div>
              </div>
            </div>
            <div className="autostash-tip" style={{ alignItems: 'center' }}>
              <Sparkles size={14} /> &quot;Stashing 10% of every lunch spend helps you reach goals 3x faster!&quot;
            </div>
          </div>
        </div>
      </div>

      {/* AI Copilot snippet (mobile) */}
      {aiSnippet && (
        <div className="ai-copilot-snippet" onClick={() => onNavigate('copilot')} style={{ cursor: 'pointer' }}>
          <div className="ai-copilot-snippet-label">AI Copilot</div>
          <div className="ai-copilot-snippet-text">{aiSnippet}</div>
        </div>
      )}
    </div>
  );
}
