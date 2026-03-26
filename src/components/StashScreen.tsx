'use client';

import { FinancialData, AutoStashSuggestion } from '@/lib/types';
import { formatNaira } from '@/lib/currency';
import { AutoStash } from '@/components/AutoStash';
import { TransactionHistory } from '@/components/TransactionHistory';

interface StashScreenProps {
  financialData: FinancialData;
  showAutoStash: boolean;
  autoStashSuggestion: AutoStashSuggestion;
  onAutoStashAccept: () => void;
  onAutoStashDecline: () => void;
  onAutoStashFeedback: (explanation: string) => void;
}

export function StashScreen({
  financialData,
  showAutoStash,
  autoStashSuggestion,
  onAutoStashAccept,
  onAutoStashDecline,
  onAutoStashFeedback,
}: StashScreenProps) {
  const pct = Math.min(100, Math.round((financialData.currentSavings / Math.max(1, financialData.savingsGoal)) * 100));

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="top-bar-greeting">Your savings</div>
          <div className="top-bar-name">Stash</div>
        </div>
      </div>

      <div className="stash-screen">
        {/* Main savings goal card */}
        <div className="savings-goal-card anim-card-1">
          <div className="autostash-hdr">
            <div className="autostash-hdr-left">
              <div className="autostash-icon">🏦</div>
              <div>
                <div className="autostash-title">Auto-Stash Goal</div>
                <div className="autostash-sub">Monthly Stash Target</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>{pct}%</div>
          </div>
          <div className="autostash-progress-bar">
            <div className="autostash-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="autostash-amounts">
            <div>
              <div className="autostash-saved">{formatNaira(financialData.currentSavings)}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>of {formatNaira(financialData.savingsGoal)} goal</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>{pct}% Achieved</div>
          </div>
          <div className="autostash-tip">
            ✦ &quot;Consistent small stashes beat big irregular ones — keep it going!&quot;
          </div>
        </div>

        {/* Auto-stash proposal if triggered */}
        {showAutoStash && (
          <div className="anim-card-2">
            <AutoStash
              suggestion={autoStashSuggestion}
              onAccept={onAutoStashAccept}
              onDecline={onAutoStashDecline}
              onSubmitFeedback={onAutoStashFeedback}
            />
          </div>
        )}

        {/* All transactions */}
        <div className="anim-card-3">
          <div className="section-hdr" style={{ padding: 0 }}>
            <h2>All Transactions</h2>
          </div>
          <TransactionHistory transactions={financialData.transactions} showAll />
        </div>
      </div>
    </div>
  );
}
