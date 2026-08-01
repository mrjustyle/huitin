'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signInWithPhonePin, signIn } from '@/features/auth/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './page.module.css';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'dev'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [state, action, pending] = useActionState(signInWithPhonePin, undefined);
  const [devState, devAction, devPending] = useActionState(signIn, undefined);

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setStep('otp');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Đăng nhập</h2>
        <p className={styles.subtitle}>
          {step === 'phone' ? 'Chào mừng quay lại Hụi Tín' 
            : step === 'dev' ? 'Đăng nhập nội bộ (Developer)'
            : `Nhập mã OTP gửi tới ${phone}`}
        </p>
      </div>

      {(error || state?.error || devState?.error) && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertIcon}>⚠</span>
          {error || state?.error || devState?.error}
        </div>
      )}

      {step === 'dev' ? (
        <form action={devAction} className={styles.form}>
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

          <Button type="submit" fullWidth loading={devPending} size="lg" style={{ marginTop: '16px' }}>
            Đăng nhập (Thật)
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => setStep('phone')}
              style={{ color: 'var(--text-secondary)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Trở về giao diện người dùng
            </button>
          </div>
        </form>
      ) : step === 'phone' ? (
        <form onSubmit={handleSendOTP} className={styles.form}>
          <Input
            label="Số điện thoại"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="Ví dụ: 0912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            }
          />

          <Button type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '16px' }}>
            Tiếp tục
          </Button>
        </form>
      ) : (
        <form action={action} className={styles.form}>
          <input type="hidden" name="phone" value={phone} />
          <Input
            label="Mã PIN (6 số)"
            name="password"
            type="password"
            inputMode="numeric"
            placeholder="••••••"
            required
            autoComplete="current-password"
            maxLength={6}
            style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
          />

          <Button type="submit" fullWidth loading={pending} size="lg" style={{ marginTop: '16px' }}>
            Đăng nhập
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <button 
              type="button" 
              onClick={() => setStep('phone')}
              style={{ color: 'var(--text-secondary)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Đổi số điện thoại
            </button>
            <button 
              type="button" 
              onClick={() => alert('Gửi mã OTP qua SMS... (Đang phát triển)')}
              style={{ color: 'var(--text-link)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Quên mã PIN?
            </button>
          </div>
        </form>
      )}

      {step === 'phone' && (
        <>
          <div className={styles.divider}>
            <span>hoặc</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              variant="outline"
              fullWidth
              size="lg"
              type="button"
              onClick={() => {
                const appId = process.env.NEXT_PUBLIC_ZALO_APP_ID;
                if (!appId) {
                  alert('Vui lòng cấu hình NEXT_PUBLIC_ZALO_APP_ID trong file .env.local');
                  return;
                }
                const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/zalo/callback`);
                window.location.href = `https://oauth.zaloapp.com/v4/permission?app_id=${appId}&redirect_uri=${redirectUri}&state=login`;
              }}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.84 14.89L13.75 14.92V14.92L11.75 16.92V14.92H8.75C8.34 14.92 8 14.58 8 14.17V9.83C8 9.42 8.34 9.08 8.75 9.08H15.25C15.66 9.08 16 9.42 16 9.83V14.14C16 14.55 15.7 14.88 15.84 14.89ZM9.5 13.5H14.5V12.5H9.5V13.5ZM9.5 11.5H14.5V10.5H9.5V11.5Z" fill="#0068FF"/>
                </svg>
              }
            >
              Tiếp tục với Zalo
            </Button>
          </div>

          <p className={styles.switchAuth}>
            Chưa có tài khoản?{' '}
            <Link href="/dang-ky" className={styles.switchLink}>
              Đăng ký ngay
            </Link>
          </p>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              onClick={() => setStep('dev')}
              style={{ color: 'var(--color-gray-400)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Dev: Đăng nhập bằng Email cũ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
