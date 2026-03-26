'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConsentModal } from '@/components/ConsentModal';

export default function ConnectBankPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [error, setError] = useState('');

  const handleAllow = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/session/connect-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: true }),
      });
      if (!response.ok) {
        setError('Unable to connect bank right now. Please try again.');
        return;
      }
      router.replace('/onboarding');
    } catch {
      setError('Unable to connect bank right now. Please try again.');
    } finally {
      setLoading(false);
      setShowConsent(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="sidebar-logo-mark">C</div>
          <div>
            <div className="sidebar-logo-name">CashWise</div>
            <div className="sidebar-logo-sub">Secure bank connection</div>
          </div>
        </div>

        <h1 className="auth-title">Connect your bank</h1>
        <p className="auth-copy">
          Connect via Mono (read-only) so CashWise can ground advice in your real transactions.
        </p>

        <div className="auth-form">
          <button className="consent-btn consent-btn-allow" onClick={() => setShowConsent(true)} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect with Mono'}
          </button>
          <button className="consent-btn consent-btn-cancel" onClick={() => router.replace('/login')} disabled={loading}>
            Back to Login
          </button>
          {error && <p className="auth-error">{error}</p>}
        </div>
      </div>

      <ConsentModal open={showConsent} onAllow={handleAllow} onCancel={() => setShowConsent(false)} />
    </main>
  );
}
