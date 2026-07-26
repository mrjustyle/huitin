'use client';

import { useState, useEffect } from 'react';
import styles from './ThemeSwitcher.module.css';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = localStorage.getItem('hui-theme') as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === 'light') {
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    } else if (t === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.removeAttribute('data-theme');
      root.style.colorScheme = '';
    }
  }

  function handleChange(t: Theme) {
    setTheme(t);
    localStorage.setItem('hui-theme', t);
    applyTheme(t);
  }

  return (
    <div className={styles.switcher}>
      <button
        className={`${styles.btn} ${theme === 'light' ? styles.active : ''}`}
        onClick={() => handleChange('light')}
        title="Sáng"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
      <button
        className={`${styles.btn} ${theme === 'system' ? styles.active : ''}`}
        onClick={() => handleChange('system')}
        title="Theo hệ thống"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </button>
      <button
        className={`${styles.btn} ${theme === 'dark' ? styles.active : ''}`}
        onClick={() => handleChange('dark')}
        title="Tối"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </button>
    </div>
  );
}
