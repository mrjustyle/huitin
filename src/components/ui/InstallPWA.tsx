'use client';

import React, { useEffect, useState } from 'react';
import styles from './InstallPWA.module.css';
import { IconBrand } from './Icons';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect if already installed (standalone)
    const isStandAloneMatch = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    
    if (isStandAloneMatch || isIosStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // For iOS, we just show our own banner (since they don't have beforeinstallprompt)
      // Check if we previously dismissed it
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        // Delay a bit so it's not too aggressive
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    // Listen to beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || !showPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      // Just show instructions for iOS (already displayed in UI, user shouldn't click this button)
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <div className={styles.installBanner}>
      <div className={styles.content}>
        <div className={styles.iconBox}>
          <IconBrand size={24} />
        </div>
        <div className={styles.textContent}>
          <h4 className={styles.title}>Cài đặt ứng dụng</h4>
          <p className={styles.desc}>
            {isIOS 
              ? <>Nhấn nút <b>Chia sẻ</b> dưới Safari và chọn <b>Thêm vào MH chính</b> (Add to Home Screen) để dùng mượt như App.</>
              : 'Thêm Hụi Tín vào màn hình chính để trải nghiệm mượt mà hơn.'}
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        {!isIOS && (
          <button className={styles.installBtn} onClick={handleInstallClick}>
            Cài đặt
          </button>
        )}
        <button className={styles.closeBtn} onClick={handleDismiss}>
          Đóng
        </button>
      </div>
    </div>
  );
}
