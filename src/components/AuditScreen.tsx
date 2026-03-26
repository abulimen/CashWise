'use client';

import { ClipboardList } from 'lucide-react';

interface AuditRow {
  timestamp: string;
  action: string;
  suggestion: string;
  user_decision: string;
  confidence: number;
}

interface AuditScreenProps {
  rows: AuditRow[];
  onRefresh: () => void;
}

export function AuditScreen({ rows, onRefresh }: AuditScreenProps) {
  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="top-bar-greeting">This week&apos;s AI actions</div>
          <div className="top-bar-name">AI Audit Trail</div>
        </div>
        <div className="top-bar-actions">
          <button className="refresh-btn refresh-btn-small" onClick={onRefresh} id="audit-refresh-btn">Refresh</button>
        </div>
      </div>

      <div className="audit-screen anim-card-1">
        <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div className="audit-empty">
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><ClipboardList size={40} color="var(--color-text-muted)" /></div>
              <div>No AI actions recorded yet.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Actions will appear here once you start chatting.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>AI Suggestion</th>
                    <th>Your Decision</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.timestamp}-${row.action}`}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(row.timestamp).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <span style={{ background: 'var(--color-primary-alpha)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                          {row.action}
                        </span>
                      </td>
                      <td style={{ maxWidth: 180 }}>{row.suggestion}</td>
                      <td>{row.user_decision}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: row.confidence >= 70 ? 'var(--color-success)' : row.confidence >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                          {row.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="disclaimer-line">CashWise is an AI advisor. We take no liability for financial decisions.</div>
      </div>
    </div>
  );
}
