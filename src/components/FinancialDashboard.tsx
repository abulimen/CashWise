'use client';

import { FinancialData } from '@/lib/types';
import { formatNaira } from '@/lib/mockData';

interface FinancialDashboardProps {
  data: FinancialData;
}

export function FinancialDashboard({ data }: FinancialDashboardProps) {
  const savingsPercent = Math.min(100, Math.round((data.currentSavings / data.savingsGoal) * 100));

  return (
    <>
      {/* Balance Card */}
      <div className="glass-card balance-card">
        <div className="balance-label">Available Balance</div>
        <div className="balance-amount">
          <span className="balance-currency">₦</span>
          {data.balance.toLocaleString('en-NG')}
        </div>
        <div className="balance-updated">
          Updated just now • {data.daysRemaining} days remaining this month
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{formatNaira(data.dailyBudget)}</div>
          <div className="stat-label">Daily Budget</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{formatNaira(data.averageDailySpending)}</div>
          <div className="stat-label">Avg. Daily Spend</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{data.daysRemaining}</div>
          <div className="stat-label">Days Left</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{formatNaira(data.currentSavings)}</div>
          <div className="stat-label">Total Saved</div>
        </div>
      </div>

      {/* Savings Goal */}
      <div className="glass-card savings-card">
        <div className="savings-header">
          <span className="savings-title">🎯 Savings Goal</span>
          <span className="savings-amount">{savingsPercent}%</span>
        </div>
        <div className="savings-bar-track">
          <div
            className="savings-bar-fill"
            style={{ width: `${savingsPercent}%` }}
          />
        </div>
        <div className="savings-detail">
          <span>{formatNaira(data.currentSavings)} saved</span>
          <span>{formatNaira(data.savingsGoal)} goal</span>
        </div>
      </div>
    </>
  );
}
