'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signInWithPhonePin, signIn } from '@/features/auth/actions';
import { IconZalo } from '@/components/ui/Icons';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './page.module.css';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [state, action, pending] = useActionState(signInWithPhonePin, undefined);

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
            : `Vui lòng nhập Mã PIN của bạn`}
        </p>
      </div>

      {(error || state?.error) && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertIcon}>⚠</span>
          {error || state?.error}
        </div>
      )}

      {step === 'phone' ? (
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
              style={{ color: '#0068FF', borderColor: '#0068FF' }}
              onClick={() => {
                const appId = process.env.NEXT_PUBLIC_ZALO_APP_ID;
                if (!appId) {
                  alert('Vui lòng cấu hình NEXT_PUBLIC_ZALO_APP_ID trong file .env.local');
                  return;
                }
                const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/zalo/callback`);
                window.location.href = `https://oauth.zaloapp.com/v4/permission?app_id=${appId}&redirect_uri=${redirectUri}&state=login`;
              }}
              icon={<IconZalo size={24} />}
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
        </>
      )}
    </div>
  );
}
