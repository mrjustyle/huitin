'use client';

import { useEffect, useState, useTransition } from 'react';

/**
 * Top loading bar: hiển thị thanh progress xanh ngọc ở top khi navigate.
 * Dùng ở root layout. Tự phát hiện route change qua popstate.
 */
export default function TopLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Intercept link clicks for client-side navigation
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      if (anchor.target === '_blank') return;
      // Same page
      if (href === window.location.pathname) return;
      setLoading(true);
    };

    // Detect navigation complete
    const handleComplete = () => {
      setTimeout(() => setLoading(false), 300);
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handleComplete);

    // MutationObserver to detect when main content changes (route changed)
    const observer = new MutationObserver(() => {
      if (loading) handleComplete();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handleComplete);
      observer.disconnect();
    };
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        background: 'var(--gradient-brand)',
        animation: 'topLoaderProgress 2s ease-in-out infinite',
        transformOrigin: 'left',
      }}
    />
  );
}
