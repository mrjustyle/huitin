'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8" cy="8" r="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="28"
              strokeDashoffset="8"
            />
          </svg>
        </span>
      )}
      {icon && !loading && <span className={styles.icon}>{icon}</span>}
      <span className={loading ? styles.labelLoading : ''}>{children}</span>
    </button>
  );
}
