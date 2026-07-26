'use client';

import { useState } from 'react';
import { adminSearchUsers } from '@/features/admin/actions';
import { activateVip, deactivateVip } from '@/features/subscription/actions';
import styles from '@/app/admin/layout.module.css';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const data = await adminSearchUsers(query);
    setUsers(data);
    setSearched(true);
    setLoading(false);
  };

  const kycBadge = (status: string) => {
    const map: Record<string, string> = {
      verified: styles.badgeGreen,
      pending: styles.badgeAmber,
      rejected: styles.badgeRed,
      not_submitted: styles.badgeGray,
    };
    const label: Record<string, string> = {
      verified: 'Đã xác minh', pending: 'Chờ duyệt',
      rejected: 'Từ chối', not_submitted: 'Chưa nộp',
    };
    return <span className={`${styles.badge} ${map[status] || styles.badgeGray}`}>{label[status] || status}</span>;
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>👤 Tìm kiếm Người dùng</h1>
        <p className={styles.pageSubtitle}>Tra cứu theo tên hoặc số điện thoại.</p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Nhập tên hoặc số điện thoại..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 24px', background: 'var(--primary)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9rem'
          }}
        >
          {loading ? 'Đang tìm...' : '🔍 Tìm kiếm'}
        </button>
      </form>

      {searched && (
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableCardTitle}>Kết quả ({users.length})</h3>
          </div>
          <div className={styles.tableWrap}>
            {users.length === 0 ? (
              <div className={styles.empty}>Không tìm thấy người dùng nào.</div>
            ) : (
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>SĐT</th>
                    <th>KYC</th>
                    <th>Gói</th>
                    <th>Tham gia</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.full_name || '—'}</td>
                      <td>{u.phone || '—'}</td>
                      <td>{kycBadge(u.kyc_status)}</td>
                      <td>
                        <span className={`${styles.badge} ${u.subscription_plan === 'vip' ? styles.badgeGreen : styles.badgeGray}`}>
                          {u.subscription_plan === 'vip' ? '💎 VIP' : 'Free'}
                        </span>
                        {u.subscription_plan === 'vip' && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: 1.4 }}>
                            Từ: {u.vip_started_at ? new Date(u.vip_started_at).toLocaleDateString('vi-VN') : '—'}
                            <br />
                            Hết: <strong style={{ color: u.vip_expires_at && new Date(u.vip_expires_at) < new Date() ? 'var(--error-color)' : 'var(--success-color)' }}>
                              {u.vip_expires_at ? new Date(u.vip_expires_at).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}
                            </strong>
                          </div>
                        )}
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        {u.subscription_plan === 'vip' ? (
                          <button
                            onClick={async () => {
                              if (!confirm(`Hủy VIP của ${u.full_name}?`)) return;
                              const res = await deactivateVip(u.id);
                              if (res.error) alert(res.error);
                              else { alert('Hủy VIP thành công'); handleSearch(new Event('submit') as any); }
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'var(--error-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Hủy VIP
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!confirm(`Kích hoạt VIP 1 tháng cho ${u.full_name}?`)) return;
                              const res = await activateVip(u.id, 1);
                              if (res.error) alert(res.error);
                              else { alert(`Kích hoạt VIP thành công! Hết hạn: ${new Date(res.expiresAt!).toLocaleDateString('vi-VN')}`); handleSearch(new Event('submit') as any); }
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            💎 Kích VIP
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
