'use client';

import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  );
}
