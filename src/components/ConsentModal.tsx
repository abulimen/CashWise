'use client';

interface ConsentModalProps {
  open: boolean;
  onAllow: () => void;
  onCancel: () => void;
}

export function ConsentModal({ open, onAllow, onCancel }: ConsentModalProps) {
  if (!open) return null;

  return (
    <div className="consent-overlay" role="dialog" aria-modal="true">
      <div className="consent-modal glass-card">
        <div className="consent-title">Data Access Consent</div>
        <p className="consent-copy">Allow CashWise to fetch your latest transactions now? (Read-only via Mono)</p>
        <div className="consent-actions">
          <button className="consent-btn consent-btn-allow" onClick={onAllow}>Allow</button>
          <button className="consent-btn consent-btn-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
