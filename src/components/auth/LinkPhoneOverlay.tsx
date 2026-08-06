'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { linkPhone, verifyLinkPhoneOTP, signOut } from '@/features/auth/actions';
import { IconBrand } from '@/components/ui/Icons';
import styles from './LinkPhoneOverlay.module.css';

export default function LinkPhoneOverlay() {
  const [step, setStep] = useState<'phone' | 'otp' | 'conflict'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await linkPhone(phone);
      if (result && result.error) {
        if (result.error.includes('tài khoản trên Hụi Tín')) {
          setError(result.error);
          setStep('conflict');
        } else {
          setError(result.error);
        }
      } else {
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await verifyLinkPhoneOTP(phone, otp);
      if (result && result.error) {
        setError(result.error);
      } else {
        // Reload page to dismiss overlay
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xác nhận OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
          <IconBrand size={48} />
        </div>
        
        <h2 className={styles.title}>Bổ sung Số điện thoại</h2>
        
        {step === 'phone' ? (
          <>
            <p className={styles.subtitle}>
              Hụi Tín bắt buộc phải có Số điện thoại để đảm bảo tính minh bạch và liên lạc khi tham gia các dây hụi. Vui lòng liên kết SĐT của bạn.
            </p>
            
            {error && <div className={styles.errorBox}>{error}</div>}
            
            <form onSubmit={handleSendOTP} className={styles.form}>
              <Input
                label="Số điện thoại của bạn"
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
              <div className={styles.actions}>
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Gửi mã OTP
                </Button>
                <form action={signOut}>
                  <Button type="submit" variant="ghost" fullWidth size="md">
                    Đăng xuất
                  </Button>
                </form>
              </div>
            </form>
          </>
        ) : step === 'otp' ? (
          <>
            <p className={styles.subtitle}>
              Nhập mã OTP 6 số vừa được gửi đến số <strong>{phone}</strong> để xác minh quyền sở hữu.
            </p>
            
            {error && <div className={styles.errorBox}>{error}</div>}
            
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
              <div className={styles.actions}>
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Xác nhận
                </Button>
                <Button type="button" variant="ghost" fullWidth size="md" onClick={() => setStep('phone')} disabled={loading}>
                  Đổi số khác
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className={styles.errorBox} style={{ fontSize: '1rem' }}>
              {error}
            </div>
            <form action={signOut} className={styles.form}>
              <Button type="submit" variant="primary" fullWidth size="lg">
                Về trang Đăng nhập
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
