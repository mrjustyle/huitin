import { getAdminDashboardStats } from '@/features/admin/actions';
import { formatVND } from '@/lib/constants';
import Link from 'next/link';
import styles from '@/app/admin/layout.module.css';

export const metadata = { title: 'Admin Dashboard — Hụi Tín' };

export default async function AdminDashboard() {
  const stats = await getAdminDashboardStats();

  if ('error' in stats && stats.error) {
    return (
      <div>
        <p style={{ color: 'var(--error-color)' }}>⚠️ {String(stats.error)}</p>
      </div>
    );
  }

  const s = stats as any;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📊 Dashboard Tổng Quan</h1>
        <p className={styles.pageSubtitle}>Cập nhật theo thời gian thực — {new Date().toLocaleString('vi-VN')}</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>👤 Tổng người dùng</span>
          <span className={styles.statValue}>{s.totalUsers?.toLocaleString()}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>⏳ Chờ duyệt KYC</span>
          <span className={`${styles.statValue} ${s.pendingKyc > 0 ? styles.statValueWarning : ''}`}>
            {s.pendingKyc}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>🔗 Tổng dây hụi</span>
          <span className={styles.statValue}>{s.totalGroups?.toLocaleString()}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>✅ Đang hoạt động</span>
          <span className={`${styles.statValue} ${styles.statValuePrimary}`}>{s.activeGroups}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>⚠️ Khiếu nại mở</span>
          <span className={`${styles.statValue} ${s.openDisputes > 0 ? styles.statValueWarning : ''}`}>
            {s.openDisputes}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>💰 Tổng giá trị đang chạy</span>
          <span className={`${styles.statValue} ${styles.statValuePrimary}`} style={{ fontSize: '1.1rem' }}>
            {formatVND(s.totalActiveValue || 0)}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableCardTitle}>Truy cập nhanh</h3>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { href: '/admin-kyc', label: '✅ Duyệt KYC đang chờ', badge: s.pendingKyc, badgeCls: s.pendingKyc > 0 ? styles.badgeRed : styles.badgeGray },
              { href: '/admin/users', label: '👤 Tìm kiếm người dùng', badge: null },
              { href: '/admin/groups', label: '🔗 Quản lý dây hụi', badge: null },
              { href: '/admin/disputes', label: '⚠️ Khiếu nại chờ xử lý', badge: s.openDisputes, badgeCls: s.openDisputes > 0 ? styles.badgeRed : styles.badgeGray },
              { href: '/admin/audit', label: '📋 Xem Audit Log', badge: null },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)', textDecoration: 'none',
                  color: 'var(--text-primary)', fontSize: '0.9rem',
                  border: '1px solid var(--border-color)',
                  transition: 'border-color 0.15s'
                }}
              >
                {item.label}
                {item.badge !== null && (
                  <span className={`${styles.badge} ${item.badgeCls}`}>{item.badge}</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableCardTitle}>Hướng dẫn Admin</h3>
          </div>
          <div style={{ padding: 20 }}>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 20, margin: 0 }}>
              <li>Duyệt KYC: Xem CCCD và chân dung, bấm Duyệt hoặc Từ chối.</li>
              <li>Tìm người dùng: Tra cứu theo tên hoặc số điện thoại.</li>
              <li>Quản lý khiếu nại: Xem lý do, bằng chứng và giải quyết.</li>
              <li>Audit Log: Ghi nhận bất biến mọi hành động hệ thống.</li>
              <li>Audit Log KHÔNG thể sửa hoặc xóa (trigger bảo vệ).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
