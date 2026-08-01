'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { sendPhoneOTP, verifyPhoneOTP, setPhonePin } from '@/features/auth/actions';
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
  
  const [state, action, pending] = useActionState(setPhonePin, undefined);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !fullName) return;
    if (!agreed) {
      setError('Vui lòng đồng ý với Điều khoản sử dụng');
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      await sendPhoneOTP(phone);
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
      await verifyPhoneOTP(phone, otp);
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
            placeholder="Ví dụ: +84912345678"
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
          
          <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required 
              style={{ marginTop: '2px' }} 
            />
            <span>
              Tôi đồng ý với <Link href="/dieu-khoan">Điều khoản dịch vụ</Link> và <Link href="/bao-mat">Chính sách bảo mật</Link> của Hụi Tín.
            </span>
          </label>

          <Button type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: '16px' }} disabled={!agreed}>
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
            style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
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
            
            <Button
              variant="outline"
              fullWidth
              size="lg"
              type="button"
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
