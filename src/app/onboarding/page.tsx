'use client';

import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <OnboardingFlow
        onCompleted={() => router.replace('/')}
        onSkip={() => router.replace('/')}
      />
    </main>
  );
}
