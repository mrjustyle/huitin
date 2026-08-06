'use client';

import { useTransition } from 'react';
import { IconGoogle, IconZalo } from '@/components/ui/Icons';
import { linkGoogleIdentity, unlinkGoogleIdentity, unlinkZaloIdentity } from '@/features/auth/actions';
import styles from './LinkedAccounts.module.css';

interface LinkedAccountsProps {
  hasGoogle: boolean;
  googleIdentityId?: string;
  hasZalo: boolean;
  canUnlink: boolean;
}

export default function LinkedAccounts({ hasGoogle, googleIdentityId, hasZalo, canUnlink }: LinkedAccountsProps) {
  const [isPending, startTransition] = useTransition();

  const handleLinkZalo = () => {
    const appId = process.env.NEXT_PUBLIC_ZALO_APP_ID;
    if (!appId) {
      alert('Chưa cấu hình Zalo APP ID');
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/zalo/callback`);
    window.location.href = `https://oauth.zaloapp.com/v4/permission?app_id=${appId}&redirect_uri=${redirectUri}&state=link`;
  };

  const handleLinkGoogle = () => {
    startTransition(async () => {
      const res = await linkGoogleIdentity();
      if (res?.error) alert(res.error);
    });
  };

  const handleUnlinkGoogle = () => {
    if (!canUnlink) {
      alert('Bạn phải có ít nhất 1 phương thức đăng nhập khác để hủy liên kết Google.');
      return;
    }
    if (!confirm('Bạn có chắc muốn hủy liên kết Google?')) return;
    
    startTransition(async () => {
      const res = await unlinkGoogleIdentity();
      if (res?.error) alert(res.error);
      else window.location.reload();
    });
  };

  const handleUnlinkZalo = () => {
    if (!canUnlink) {
      alert('Bạn phải có ít nhất 1 phương thức đăng nhập khác để hủy liên kết Zalo.');
      return;
    }
    if (!confirm('Bạn có chắc muốn hủy liên kết Zalo?')) return;
    
    startTransition(async () => {
      const res = await unlinkZaloIdentity();
      if (res?.error) alert(res.error);
      else window.location.reload();
    });
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Tài khoản liên kết</h3>
      
      <div className={styles.list}>
        {/* Google */}
        <div className={styles.item}>
          <div className={styles.provider}>
            <div className={styles.iconBox}>
              <IconGoogle size={20} />
            </div>
            <div className={styles.info}>
              <span className={styles.name}>Google</span>
              {hasGoogle ? (
                <span className={`${styles.status} ${styles.statusLinked}`}>Đã liên kết</span>
              ) : (
                <span className={`${styles.status} ${styles.statusUnlinked}`}>Chưa liên kết</span>
              )}
            </div>
          </div>
          
          {hasGoogle ? (
            <button 
              className={`${styles.action} ${canUnlink ? styles.actionUnlink : styles.actionDisabled}`}
              onClick={handleUnlinkGoogle}
              disabled={isPending || !canUnlink}
              title={!canUnlink ? 'Không thể hủy phương thức đăng nhập duy nhất' : 'Hủy liên kết'}
            >
              Hủy
            </button>
          ) : (
            <button 
              className={`${styles.action} ${styles.actionLink}`}
              onClick={handleLinkGoogle}
              disabled={isPending}
            >
              Liên kết
            </button>
          )}
        </div>

        {/* Zalo */}
        <div className={styles.item}>
          <div className={styles.provider}>
            <div className={styles.iconBox}>
              <IconZalo size={20} />
            </div>
            <div className={styles.info}>
              <span className={styles.name}>Zalo</span>
              {hasZalo ? (
                <span className={`${styles.status} ${styles.statusLinked}`}>Đã liên kết</span>
              ) : (
                <span className={`${styles.status} ${styles.statusUnlinked}`}>Chưa liên kết</span>
              )}
            </div>
          </div>
          
          {hasZalo ? (
            <button 
              className={`${styles.action} ${canUnlink ? styles.actionUnlink : styles.actionDisabled}`}
              onClick={handleUnlinkZalo}
              disabled={isPending || !canUnlink}
              title={!canUnlink ? 'Không thể hủy phương thức đăng nhập duy nhất' : 'Hủy liên kết'}
            >
              Hủy
            </button>
          ) : (
            <button 
              className={`${styles.action} ${styles.actionLink}`}
              onClick={handleLinkZalo}
              disabled={isPending}
            >
              Liên kết
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
