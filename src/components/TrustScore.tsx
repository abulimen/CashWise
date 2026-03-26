'use client';

import { useState, useEffect } from 'react';
import { TrustScoreResult } from '@/lib/types';

interface TrustScoreProps {
  result: TrustScoreResult;
}

export function TrustScore({ result }: TrustScoreProps) {
  const [expanded, setExpanded] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = animated
    ? circumference - (result.overall / 100) * circumference
    : circumference;

  const fillColor = result.overall >= 75
    ? 'var(--color-primary)'
    : result.overall >= 50
    ? 'var(--color-warning)'
    : 'var(--color-danger)';

  return (
    <div
      className="trust-card anim-card-3"
      style={{ margin: '0 16px' }}
      onClick={() => setExpanded(!expanded)}
      id="trust-score-card"
    >
      {/* Compact row view */}
      <div className="trust-card-row">
        <div className="trust-badge">
          <div className="trust-badge-icon">🏅</div>
          <div>
            <div className="trust-badge-label">Trust Score</div>
            <div className="trust-badge-sub">Building credit</div>
          </div>
        </div>
        <div className="trust-score-num">
          <div className="trust-score-num-val">{result.overall}</div>
          <div className="trust-score-num-verdict">
            ↗ {result.label}
          </div>
        </div>
      </div>

      {/* Expanded gauge + breakdown */}
      {expanded && (
        <div style={{ animation: 'card-in 0.3s ease' }}>
          <div className="trust-gauge-wrap">
            <svg className="trust-gauge-svg" width="120" height="120">
              <circle cx="60" cy="60" r={radius} strokeWidth="8" fill="none" className="trust-gauge-track" />
              <circle
                cx="60" cy="60" r={radius} strokeWidth="8" fill="none"
                stroke={fillColor}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="trust-gauge-fill"
              />
            </svg>
            <div className="trust-gauge-text">
              <div className="trust-gauge-text-val">{result.overall}</div>
              <div className="trust-gauge-text-lbl">{result.label}</div>
            </div>
          </div>

          <div className="trust-factors">
            {result.factors.map((f) => {
              const fc = f.score >= 75 ? 'var(--color-success)' : f.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
              return (
                <div key={f.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="trust-factor-name">{f.name}</span>
                    <span className="trust-factor-score" style={{ color: fc }}>{f.score}/100</span>
                  </div>
                  <div className="trust-factor-bar-track">
                    <div className="trust-factor-bar-fill" style={{ width: `${f.score}%`, background: fc }} />
                  </div>
                  <div className="trust-factor-note">{f.explanation}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 8 }}>
        {expanded ? 'tap to collapse' : 'tap to expand'}
      </div>
    </div>
  );
}
