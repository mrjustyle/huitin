'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/features/auth/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../dang-nhap/page.module.css';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);

  if (state?.success) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Đã gửi email! 📧</h2>
          <p className={styles.subtitle}>
            Nếu email bạn nhập tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.
            Vui lòng kiểm tra hộp thư.
          </p>
        </div>
        <Link href="/dang-nhap">
          <Button variant="outline" fullWidth size="lg">
            Quay lại đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quên mật khẩu?</h2>
        <p className={styles.subtitle}>
          Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.
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

        <Button type="submit" fullWidth loading={pending} size="lg">
          Gửi liên kết đặt lại
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
