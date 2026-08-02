'use client';

import { useState, useEffect } from 'react';
import { getRecentOTPs } from '@/features/admin/actions';
import styles from '@/app/admin/layout.module.css';

export default function AdminOtpsPage() {
  const [otps, setOtps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOTPs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecentOTPs();
      if (res.error) {
        setError(res.error);
      } else {
        setOtps(res.otps || []);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTPs();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt).getTime() < Date.now();
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🔐 Lịch sử gửi OTP</h1>
          <p className={styles.pageSubtitle}>Xem 50 mã OTP được yêu cầu gần nhất.</p>
        </div>
        <button 
          onClick={fetchOTPs} 
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-primary-600)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontWeight: 500
          }}
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-danger-transparent)', color: 'var(--color-danger-500)', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Số điện thoại</th>
              <th>Mã OTP</th>
              <th>Thời gian tạo</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {otps.map((otp, index) => {
              const expired = isExpired(otp.expires_at);
              return (
                <tr key={index}>
                  <td>
                    <strong>{otp.phone}</strong>
                  </td>
                  <td>
                    <code style={{ 
                      padding: '4px 8px', 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      letterSpacing: '2px'
                    }}>
                      {otp.otp}
                    </code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(otp.created_at)}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${expired ? styles.badgeGray : styles.badgeGreen}`}>
                      {expired ? 'Hết hạn' : 'Còn hiệu lực'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {otps.length === 0 && !loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  Chưa có dữ liệu OTP nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
