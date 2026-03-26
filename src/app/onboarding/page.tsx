'use client';

import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <OnboardingFlow
          onCompleted={() => router.replace('/')}
          onSkip={() => router.replace('/')}
        />
      </div>
    </main>
  );
}
