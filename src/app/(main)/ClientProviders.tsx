'use client';

import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import PushNotificationProvider from '@/components/providers/PushNotificationProvider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PushNotificationProvider>
      <OnboardingProvider>
        {children}
      </OnboardingProvider>
    </PushNotificationProvider>
  );
}
