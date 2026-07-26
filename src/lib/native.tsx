'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

export function useNativePlatform() {
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Capacitor) {
      setIsNative(window.Capacitor.isNativePlatform());
      const p = window.Capacitor.getPlatform();
      setPlatform(p as 'web' | 'ios' | 'android');
    }
  }, []);

  return { platform, isNative };
}

// Safe area padding for native apps (notch, status bar)
export function NativeSafeArea({ children }: { children: React.ReactNode }) {
  const { isNative } = useNativePlatform();

  if (!isNative) return <>{children}</>;

  return (
    <div style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }}>
      {children}
    </div>
  );
}
