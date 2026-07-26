'use client';

import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

export default function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Only run on iOS or Android
    if (Capacitor.getPlatform() === 'web') return;
    
    // Don't ask for permission on public pages like login/register
    if (pathname?.startsWith('/dang-nhap') || pathname?.startsWith('/dang-ky')) return;

    const registerPush = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('User denied push notification permission');
          return;
        }

        await PushNotifications.register();
      } catch (err) {
        console.error('Error registering push notifications:', err);
      }
    };

    registerPush();

    // Listeners
    const registrationListener = PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      setIsRegistered(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase.from('user_push_tokens').upsert({
        user_id: session.user.id,
        fcm_token: token.value,
        device_info: Capacitor.getPlatform()
      }, { onConflict: 'user_id,fcm_token' });

      if (error) {
        console.error('Failed to save push token to DB:', error);
      }
    });

    const errorListener = PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    return () => {
      registrationListener.then(l => l.remove());
      errorListener.then(l => l.remove());
    };
  }, [pathname, supabase]);

  return <>{children}</>;
}
