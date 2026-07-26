'use client';

import { useState, useEffect } from 'react';
import { getPendingKycList, processKycRequest } from '@/features/kyc/admin-actions';
import Button from '@/components/ui/Button';
import PageLoader from '@/components/ui/PageLoader';
import { useToast } from '@/components/ui/Toast';
import styles from '@/app/admin/layout.module.css';
import kycStyles from './page.module.css';

export default function AdminKycPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addToast } = useToast();

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
      addToast({ type: 'error', title: 'Lỗi KYC', message: result.error });
    } else {
      setUsers(users.filter(u => u.id !== userId));
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>✅ Duyệt hồ sơ KYC</h1>
        </div>
        <PageLoader showCards={3} lines={4} showHeader={false} />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>✅ Duyệt hồ sơ KYC</h1>
        <p className={styles.pageSubtitle}>
          Xem xét và duyệt xác minh danh tính người dùng. Hiện có <strong>{users.length}</strong> hồ sơ chờ duyệt.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          ⚠ {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className={styles.empty} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          🎉 Không có hồ sơ nào đang chờ duyệt.
        </div>
      ) : (
        <div className={kycStyles.kycList}>
          {users.map(user => (
            <div key={user.id} className={kycStyles.kycItem} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className={kycStyles.kycRow}>
                <div className={kycStyles.kycInfo}>
                  <strong style={{ color: 'var(--text-primary)' }}>{user.full_name || '(Trống)'}</strong>
                  <span className={kycStyles.kycMeta}>
                    📞 {user.phone || '(Trống)'} · 📅 {new Date(user.kyc_submitted_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className={kycStyles.kycActions}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                  >
                    {expandedId === user.id ? '🔼 Ẩn ảnh' : '🔽 Xem ảnh CCCD'}
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
                    style={{ color: 'var(--error-color)' }}
                  >
                    ❌ Từ chối
                  </Button>
                </div>
              </div>

              {expandedId === user.id && user.imageUrls && (
                <div className={kycStyles.kycImages}>
                  {user.imageUrls.cccdFront && (
                    <div className={kycStyles.imageBox}>
                      <span className={kycStyles.imageLabel}>CCCD Mặt trước</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.imageUrls.cccdFront} alt="CCCD Front" className={kycStyles.kycImg} />
                    </div>
                  )}
                  {user.imageUrls.cccdBack && (
                    <div className={kycStyles.imageBox}>
                      <span className={kycStyles.imageLabel}>CCCD Mặt sau</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.imageUrls.cccdBack} alt="CCCD Back" className={kycStyles.kycImg} />
                    </div>
                  )}
                  {user.imageUrls.selfie && (
                    <div className={kycStyles.imageBox}>
                      <span className={kycStyles.imageLabel}>Ảnh chân dung</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.imageUrls.selfie} alt="Selfie" className={kycStyles.kycImg} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
