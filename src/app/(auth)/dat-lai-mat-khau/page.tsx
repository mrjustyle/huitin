'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/features/auth/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../dang-nhap/page.module.css';

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  if (state?.success) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Đặt lại thành công! ✅</h2>
          <p className={styles.subtitle}>
            Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
          </p>
        </div>
        <Link href="/dang-nhap">
          <Button fullWidth size="lg">
            Đăng nhập ngay
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Đặt lại mật khẩu</h2>
        <p className={styles.subtitle}>
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {state?.error && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertIcon}>⚠</span>
          {state.error}
        </div>
      )}

      <form action={action} className={styles.form}>
        <Input
          label="Mật khẩu mới"
          name="password"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          required
          autoComplete="new-password"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          }
        />

        <Input
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          required
          autoComplete="new-password"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 01.5-.87l8-4.5a1 1 0 01.98 0l8 4.5A1 1 0 0120 6v7z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <Button type="submit" fullWidth loading={pending} size="lg">
          Đặt lại mật khẩu
        </Button>
      </form>

      <p className={styles.switchAuth}>
        <Link href="/dang-nhap" className={styles.switchLink}>
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
