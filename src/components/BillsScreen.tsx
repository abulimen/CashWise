'use client';

import { CalendarClock } from 'lucide-react';
import { formatNaira } from '@/lib/currency';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface BillItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface BillsScreenProps {
  bills: BillItem[];
}

export function BillsScreen({ bills }: BillsScreenProps) {
  const today = new Date();
  const rows = [...bills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="top-bar-greeting">Upcoming obligations</div>
          <div className="top-bar-name">Bills</div>
        </div>
      </div>

      <div className="stash-screen">
        <div className="section-hdr" style={{ padding: 0 }}>
          <h2>Due bills</h2>
          <button className="btn btn-primary btn-sm">
            <Plus size={14} /> Add bill
          </button>
        </div>

        <div className="txn-card">
          <div className="txn-list">
            {rows.length === 0 && (
              <div style={{ padding: '24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
                No bills available yet.
              </div>
            )}
            {rows.map((bill) => {
              const due = new Date(bill.dueDate);
              const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const dueText = diffDays < 0 ? 'Overdue' : diffDays === 0 ? 'Due today' : `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
              return (
                <div key={bill.id} className="txn-item bill-item">
                  <div className="bill-main">
                    <div className="txn-icon">
                      <CalendarClock size={18} />
                    </div>
                    <div className="txn-info">
                      <div className="txn-name">{bill.name}</div>
                      <div className="txn-meta">
                        {new Date(bill.dueDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })} • {dueText}
                      </div>
                    </div>
                  </div>
                  <div className="bill-actions">
                    <div className="txn-amount-debit">{formatNaira(bill.amount)}</div>
                    <div className="bill-action-row">
                      <button className="btn btn-outline btn-sm" title="Edit">
                        <Pencil size={14} /> <span className="action-text">Edit</span>
                      </button>
                      <button className="btn btn-danger btn-sm" title="Remove">
                        <Trash2 size={14} /> <span className="action-text">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
