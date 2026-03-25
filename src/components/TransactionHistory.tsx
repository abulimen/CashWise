'use client';

import { Transaction } from '@/lib/types';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  airtime: '📱',
  entertainment: '🎬',
  education: '📚',
  shopping: '🛍️',
  savings: '🏦',
  income: '💰',
  transfer: '↔️',
  other: '📋',
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  // Show last 8 transactions, most recent first
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-4)',
      }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>🧾 Recent Transactions</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          last {recent.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {recent.map((txn) => (
          <div
            key={txn.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) 0',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              flexShrink: 0,
            }}>
              {CATEGORY_ICONS[txn.category || 'other'] || '📋'}
            </div>

            {/* Description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {txn.narration || 'No narration'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {formatDate(txn.date)}
              </div>
            </div>

            {/* Amount */}
            <div style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: txn.type === 'credit' ? 'var(--color-yes)' : 'var(--color-text-primary)',
              flexShrink: 0,
            }}>
              {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString('en-NG')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
