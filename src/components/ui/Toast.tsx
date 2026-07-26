'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { IconSuccess, IconError, IconWarning, IconInfo } from '@/components/ui/Icons';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
            role="alert"
          >
            <div className={styles.iconWrap}>
              <ToastIcon type={toast.type} />
            </div>
            <div className={styles.content}>
              <p className={styles.title}>{toast.title}</p>
              {toast.message && (
                <p className={styles.message}>{toast.message}</p>
              )}
            </div>
            <button
              className={styles.close}
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng"
            >
              <IconError size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <IconSuccess size={20} />;
  if (type === 'error') return <IconError size={20} />;
  if (type === 'warning') return <IconWarning size={20} />;
  return <IconInfo size={20} />;
}
