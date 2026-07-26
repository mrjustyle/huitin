'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signUp } from '@/features/auth/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../dang-nhap/page.module.css';

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [agreed, setAgreed] = useState(false);

  if (state?.success) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Kiểm tra email! 📧</h2>
          <p className={styles.subtitle}>
            Chúng tôi đã gửi email xác nhận đến hộp thư của bạn.
            Vui lòng kiểm tra và nhấn vào liên kết xác nhận để hoàn tất đăng ký.
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
        <h2 className={styles.title}>Đăng ký</h2>
        <p className={styles.subtitle}>Tạo tài khoản Hụi Tín miễn phí</p>
      </div>

      {state?.error && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertIcon}>⚠</span>
          {state.error}
        </div>
      )}

      <form action={action} className={styles.form}>
        <Input
          label="Họ và tên"
          name="fullName"
          type="text"
          placeholder="Nguyễn Văn A"
          required
          autoComplete="name"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />

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
          label="Số điện thoại"
          name="phone"
          type="tel"
          placeholder="0912 345 678"
          autoComplete="tel"
          hint="Không bắt buộc, nhưng cần thiết cho KYC"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
          }
        />

        <Input
          label="Mật khẩu"
          name="password"
          type="password"
          placeholder="Ít nhất 8 ký tự"
          required
          minLength={8}
          autoComplete="new-password"
          hint="Tối thiểu 8 ký tự, gồm chữ và số"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          }
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              marginTop: '2px',
              accentColor: 'var(--color-primary-600)',
            }}
          />
          <span>
            Tôi đồng ý với{' '}
            <a href="#" style={{ color: 'var(--color-primary-600)', fontWeight: 500 }}>
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="#" style={{ color: 'var(--color-primary-600)', fontWeight: 500 }}>
              Chính sách bảo mật
            </a>
          </span>
        </label>

        <Button type="submit" fullWidth loading={pending} size="lg" disabled={!agreed}>
          Đăng ký
        </Button>
      </form>

      <p className={styles.switchAuth}>
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className={styles.switchLink}>
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
