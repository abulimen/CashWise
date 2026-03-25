'use client';

import { useState, useEffect } from 'react';
import { TrustScoreResult } from '@/lib/types';

interface TrustScoreProps {
  result: TrustScoreResult;
}

export function TrustScore({ result }: TrustScoreProps) {
  const [expanded, setExpanded] = useState(false);
  const [animated, setAnimated] = useState(false);

  // Animate ring on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // SVG ring calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (result.overall / 100) * circumference;
  // Start from full (empty ring) then animate to target
  const offset = animated ? targetOffset : circumference;

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'var(--color-yes)';
    if (score >= 50) return 'var(--color-caution)';
    return 'var(--color-no)';
  };

  const mainColor = getScoreColor(result.overall);

  return (
    <div
      className="glass-card trust-score-card"
      onClick={() => setExpanded(!expanded)}
      style={{ cursor: 'pointer' }}
    >
      <div className="trust-score-header">
        <span className="trust-score-title">📈 Financial Trust Score</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {expanded ? 'tap to collapse' : 'tap to see why'}
        </span>
      </div>

      <div className="trust-score-gauge">
        <svg className="trust-score-ring" width="120" height="120">
          <circle
            className="trust-score-ring-bg"
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="8"
            fill="none"
            stroke={mainColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <span className="trust-score-value" style={{ color: mainColor }}>
          {result.overall}
        </span>
        <span className="trust-score-label-text">{result.label}</span>
      </div>

      {/* Expandable breakdown */}
      {expanded && (
        <div className="trust-score-factors" style={{ animation: 'fade-in 0.3s ease' }}>
          {result.factors.map((factor, i) => (
            <div key={i} className="trust-score-factor">
              <div className="trust-score-factor-header">
                <span className="trust-score-factor-name">{factor.name}</span>
                <span className="trust-score-factor-score">{factor.score}/100</span>
              </div>
              <div className="trust-score-factor-bar">
                <div
                  className="trust-score-factor-fill"
                  style={{
                    width: `${factor.score}%`,
                    background: getScoreColor(factor.score),
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
              <div className="trust-score-factor-explanation">{factor.explanation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
