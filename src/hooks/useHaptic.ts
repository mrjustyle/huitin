'use client';

import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback } from 'react';

export function useHaptic() {
  const triggerHaptic = useCallback(async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    try {
      // Check if we are running in Capacitor native context
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNative) {
        if (style === 'light') await Haptics.impact({ style: ImpactStyle.Light });
        else if (style === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
        else if (style === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
        else if (style === 'success' || style === 'warning' || style === 'error') {
          // Fallback to medium for generic notifications if needed, 
          // but Capacitor Haptics has notification type in full API.
          // For simplicity, we just use impact here.
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
      } else {
        // Web Fallback using navigator.vibrate
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          switch (style) {
            case 'light':
              navigator.vibrate(10);
              break;
            case 'medium':
              navigator.vibrate(20);
              break;
            case 'heavy':
              navigator.vibrate(40);
              break;
            case 'success':
              navigator.vibrate([10, 50, 20]);
              break;
            case 'error':
              navigator.vibrate([20, 50, 20, 50, 30]);
              break;
            default:
              navigator.vibrate(10);
          }
        }
      }
    } catch (error) {
      // Ignore haptic errors
      console.warn('Haptic feedback failed:', error);
    }
  }, []);

  return { haptic: triggerHaptic };
}
