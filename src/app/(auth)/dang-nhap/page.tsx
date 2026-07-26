'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn, signInWithGoogle } from '@/features/auth/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './page.module.css';

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Đăng nhập</h2>
        <p className={styles.subtitle}>Chào mừng quay lại Hụi Tín</p>
      </div>

      {state?.error && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertIcon}>⚠</span>
          {state.error}
        </div>
      )}

      <form action={action} className={styles.form}>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          autoComplete="email"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
          }
        />

        <Input
          label="Mật khẩu"
          name="password"
          type="password"
          placeholder="Nhập mật khẩu"
          required
          autoComplete="current-password"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          }
        />

        <div className={styles.formActions}>
          <Link href="/quen-mat-khau" className={styles.forgotLink}>
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={pending} size="lg">
          Đăng nhập
        </Button>
      </form>

      <div className={styles.divider}>
        <span>hoặc</span>
      </div>

      <form action={signInWithGoogle}>
      <Button
        variant="outline"
        fullWidth
        size="lg"
        type="submit"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        }
      >
        Tiếp tục với Google
      </Button>
      </form>

      <p className={styles.switchAuth}>
        Chưa có tài khoản?{' '}
        <Link href="/dang-ky" className={styles.switchLink}>
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
