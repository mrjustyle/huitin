'use client';

import { useState, useEffect } from 'react';
import { IconSun, IconMoon, IconDevice } from '@/components/ui/Icons';

type Theme = 'system' | 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', t);
    }
  };

  const cycleTheme = () => {
    const order: Theme[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('theme', next);
  };

  const label = theme === 'dark' ? 'Tối' : theme === 'light' ? 'Sáng' : 'Hệ thống';

  return (
    <button
      onClick={cycleTheme}
      title={`Chế độ: ${label}`}
      aria-label={`Chuyển chế độ hiển thị (hiện: ${label})`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-lg)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s, transform 0.15s',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {theme === 'dark' ? <IconMoon size={18} /> : theme === 'light' ? <IconSun size={18} /> : <IconDevice size={18} />}
    </button>
  );
}
