'use client';

import { useState, useEffect } from 'react';
import { getPendingKycList, processKycRequest } from '@/features/kyc/admin-actions';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function AdminKycPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await getPendingKycList();
    if (error) {
      setError(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Bạn chắc chắn muốn ${action === 'approve' ? 'DUYỆT' : 'TỪ CHỐI'} hồ sơ này?`)) return;
    
    setProcessingId(userId);
    const result = await processKycRequest(userId, action);
    
    if (result.error) {
      alert(result.error);
    } else {
      setUsers(users.filter(u => u.id !== userId));
    }
    setProcessingId(null);
  };

  if (loading) {
    return <div className={styles.container}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Duyệt hồ sơ KYC</h1>
        <p className={styles.subtitle}>
          Trang quản trị dành cho Admin để duyệt xác minh danh tính.
        </p>
      </div>

      {error && <div className={styles.alert}>⚠ {error}</div>}

      <div className={styles.card}>
        {users.length === 0 ? (
          <div className={styles.empty}>Không có hồ sơ nào đang chờ duyệt.</div>
        ) : (
          <div className={styles.kycList}>
            {users.map(user => (
              <div key={user.id} className={styles.kycItem}>
                <div className={styles.kycRow}>
                  <div className={styles.kycInfo}>
                    <strong>{user.full_name || '(Trống)'}</strong>
                    <span className={styles.kycMeta}>
                      📞 {user.phone || '(Trống)'} · 📅 {new Date(user.kyc_submitted_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className={styles.kycActions}>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                    >
                      {expandedId === user.id ? '🔼 Ẩn ảnh' : '🔽 Xem ảnh'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAction(user.id, 'approve')}
                      loading={processingId === user.id}
                      disabled={processingId !== null}
                      style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)' }}
                    >
                      ✅ Duyệt
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleAction(user.id, 'reject')}
                      loading={processingId === user.id}
                      disabled={processingId !== null}
                      style={{ color: 'var(--danger-color)' }}
                    >
                      ❌ Từ chối
                    </Button>
                  </div>
                </div>

                {expandedId === user.id && user.imageUrls && (
                  <div className={styles.kycImages}>
                    {user.imageUrls.cccdFront && (
                      <div className={styles.imageBox}>
                        <span className={styles.imageLabel}>CCCD Mặt trước</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={user.imageUrls.cccdFront} alt="CCCD Front" className={styles.kycImg} />
                      </div>
                    )}
                    {user.imageUrls.cccdBack && (
                      <div className={styles.imageBox}>
                        <span className={styles.imageLabel}>CCCD Mặt sau</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={user.imageUrls.cccdBack} alt="CCCD Back" className={styles.kycImg} />
                      </div>
                    )}
                    {user.imageUrls.selfie && (
                      <div className={styles.imageBox}>
                        <span className={styles.imageLabel}>Ảnh chân dung</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={user.imageUrls.selfie} alt="Selfie" className={styles.kycImg} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
