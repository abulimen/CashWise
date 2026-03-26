'use client';

import { Transaction } from '@/lib/types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  showAll?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️', transport: '🚗', airtime: '📱',
  entertainment: '🎬', education: '📚', shopping: '🛍️',
  savings: '🏦', income: '💰', transfer: '↔️', other: '📋',
};

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const date = new Date(tx.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = `Today, ${date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }).toUpperCase()}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }
  return groups;
}

export function TransactionHistory({ transactions, showAll = false }: TransactionHistoryProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const visible = showAll ? sorted : sorted.slice(0, 8);
  const groups = groupByDate(visible);

  if (visible.length === 0) {
    return (
      <div className="txn-card">
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
          No transactions yet
        </div>
      </div>
    );
  }

  return (
    <div className="txn-card">
      <div className="txn-list">
        {Object.entries(groups).map(([dateLabel, txns]) => (
          <div key={dateLabel}>
            <div className="txn-date-hdr">{dateLabel}</div>
            {txns.map((txn) => (
              <div key={txn.id} className="txn-item">
                <div className="txn-icon">
                  {CATEGORY_ICONS[txn.category || 'other'] ?? '📋'}
                </div>
                <div className="txn-info">
                  <div className="txn-name">{txn.narration || 'No narration'}</div>
                  <div className="txn-meta">
                    {new Date(txn.date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className={txn.type === 'credit' ? 'txn-amount-credit' : 'txn-amount-debit'}>
                  {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString('en-NG')}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
