'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const proceed = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/session/login', { method: 'POST' });
      if (!response.ok) {
        setError('Unable to sign in right now. Please try again.');
        return;
      }
      router.replace('/connect-bank');
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="sidebar-logo-mark">C</div>
          <div>
            <div className="sidebar-logo-name">CashWise</div>
            <div className="sidebar-logo-sub">AI you can trust with your money</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-copy">Sign in to continue and set up your trusted financial copilot.</p>

        <div className="auth-form">
          <input
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="auth-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="consent-btn consent-btn-allow" onClick={proceed} disabled={loading}>
            {loading ? 'Signing in...' : 'Get Started'}
          </button>
          <button className="consent-btn consent-btn-cancel" onClick={proceed} disabled={loading}>
            Sign in with Google
          </button>
          {error && <p className="auth-error">{error}</p>}
        </div>
      </div>
    </main>
  );
}
