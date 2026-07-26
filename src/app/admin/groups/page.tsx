'use client';

import { useState } from 'react';
import { adminSearchGroups } from '@/features/admin/actions';
import { formatVND } from '@/lib/constants';
import styles from '@/app/admin/layout.module.css';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Nháp', cls: 'badgeGray' },
  recruiting: { label: 'Tuyển', cls: 'badgePrimary' },
  pending_agreement: { label: 'Chờ ký', cls: 'badgeAmber' },
  active: { label: 'Hoạt động', cls: 'badgeGreen' },
  completed: { label: 'Hoàn thành', cls: 'badgeGreen' },
  suspended: { label: 'Tạm dừng', cls: 'badgeAmber' },
  in_dispute: { label: 'Tranh chấp', cls: 'badgeRed' },
  cancelled: { label: 'Đã hủy', cls: 'badgeGray' },
};

export default function AdminGroupsPage() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const data = await adminSearchGroups(query);
    setGroups(data);
    setSearched(true);
    setLoading(false);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔗 Tìm kiếm Dây Hụi</h1>
        <p className={styles.pageSubtitle}>Tra cứu theo tên dây hụi.</p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Nhập tên dây hụi..."
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
            <h3 className={styles.tableCardTitle}>Kết quả ({groups.length})</h3>
          </div>
          <div className={styles.tableWrap}>
            {groups.length === 0 ? (
              <div className={styles.empty}>Không tìm thấy dây hụi nào.</div>
            ) : (
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Trạng thái</th>
                    <th>Loại</th>
                    <th>Giá trị/phần</th>
                    <th>Tổng phần</th>
                    <th>Tổng giá trị</th>
                    <th>Tạo ngày</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g: any) => {
                    const st = STATUS_MAP[g.status] || { label: g.status, cls: 'badgeGray' };
                    return (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{g.name}</td>
                        <td><span className={`${styles.badge} ${(styles as any)[st.cls]}`}>{st.label}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{g.hui_type}</td>
                        <td>{formatVND(g.share_value)}</td>
                        <td>{g.total_shares}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {formatVND(g.share_value * g.total_shares)}
                        </td>
                        <td>{new Date(g.created_at).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <a
                            href={`/day-hui/${g.id}`}
                            target="_blank"
                            rel="noopener"
                            style={{ color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none' }}
                          >
                            Xem →
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
