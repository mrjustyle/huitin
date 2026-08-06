'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';
import { sendPhoneOTP, verifyPhoneOTP, setPhonePin, signInWithGoogle } from '@/features/auth/actions';
import { IconZalo, IconGoogle } from '@/components/ui/Icons';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../dang-nhap/page.module.css';

export default function SignupPage() {
  const [step, setStep] = useState<'info' | 'otp' | 'pin'>('info');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  const [state, action, pending] = useActionState(setPhonePin, undefined);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !fullName) return;
    if (!agreed) {
      setError('Vui lòng đồng ý với Điều khoản sử dụng');
      return;
    }
    if (!turnstileToken) {
      setError('Vui lòng hoàn thành xác minh bảo mật');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await sendPhoneOTP(phone, turnstileToken);
      if (typeof res === 'object' && res?.error) {
        setError(res.error);
        return;
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await verifyPhoneOTP(phone, otp);
      if (typeof res === 'object' && res?.error) {
        setError(res.error);
        return;
      }
      setStep('pin');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  // Khi signUp thành công, chuyển hướng người dùng
  if (state?.success) {
    window.location.href = '/trang-chu';
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Đăng ký</h2>
        <p className={styles.subtitle}>
          {step === 'info' ? 'Tạo tài khoản Hụi Tín miễn phí' 
            : step === 'otp' ? `Nhập mã OTP gửi tới ${phone}`
            : 'Tạo Mã PIN 6 số để đăng nhập an toàn'}
        </p>
      </div>

      {(error || state?.error) && (
        <div className={styles.alert} role="alert">
          <span className={styles.alertIcon}>⚠</span>
          {error || state?.error}
        </div>
      )}

      {step === 'info' ? (
        <form onSubmit={handleSendOTP} className={styles.form}>
          <Input
            label="Họ và tên"
            name="fullName"
            type="text"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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
          
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              Tôi đồng ý với <Link href="/thoa-thuan" className={styles.link}>Điều khoản dịch vụ</Link> và <Link href="/chinh-sach" className={styles.link}>Chính sách bảo mật</Link> của Hụi Tín.
            </span>
          </label>

          <div style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center' }}>
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => setTurnstileToken(token)}
              options={{
                theme: 'dark'
              }}
            />
          </div>

          <Button 
            type="submit" 
            fullWidth 
            disabled={!phone || !fullName || !agreed || !turnstileToken || loading}
            loading={loading}
          >
            Đăng ký bằng SĐT
          </Button>
        </form>
      ) : step === 'otp' ? (
        <form onSubmit={handleVerifyOTP} className={styles.form}>
          <Input
            label="Mã xác thực (OTP)"
            name="otp"
            type="text"
            inputMode="numeric"
            placeholder="Nhập mã 6 số"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            autoComplete="one-time-code"
            maxLength={6}
            style={{ letterSpacing: otp ? '0.5em' : 'normal', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
          />

          <Button type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '16px' }}>
            Xác nhận OTP
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => setStep('info')}
              style={{ color: 'var(--text-secondary)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Thay đổi thông tin
            </button>
          </div>
        </form>
      ) : (
        <form action={action} className={styles.form}>
          <input type="hidden" name="fullName" value={fullName} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="otp" value={otp} />

          <Input
            label="Tạo Mã PIN (6 số)"
            name="password"
            type="password"
            inputMode="numeric"
            placeholder="••••••"
            required
            maxLength={6}
            style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
          />

          <Button type="submit" fullWidth loading={pending} size="lg" style={{ marginTop: '16px' }}>
            Hoàn tất Đăng ký
          </Button>
          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Mã PIN này sẽ dùng để đăng nhập vào các lần sau.
          </p>
        </form>
      )}


      {step === 'info' && (
        <>
          <div className={styles.divider}>
            <span>hoặc</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <form action={signInWithGoogle}>
              <Button
                variant="outline"
                fullWidth
                size="lg"
                type="submit"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                icon={<IconGoogle size={24} />}
              >
                Tiếp tục với Google
              </Button>
            </form>

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
            Đã có tài khoản?{' '}
            <Link href="/dang-nhap" className={styles.switchLink}>
              Đăng nhập ngay
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
