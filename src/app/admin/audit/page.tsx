import { getAuditLog } from '@/features/admin/actions';
import styles from '@/app/admin/layout.module.css';

export const metadata = { title: 'Audit Log — Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const events = await getAuditLog(100);

  const actionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('REJECT')) return 'var(--error-color)';
    if (action.includes('INSERT') || action.includes('CREATE') || action.includes('APPROVE')) return 'var(--success-color)';
    if (action.includes('UPDATE') || action.includes('CONFIRM')) return 'var(--primary)';
    return 'var(--text-secondary)';
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📋 Audit Log</h1>
        <p className={styles.pageSubtitle}>
          Nhật ký hành động bất biến — Không thể sửa hoặc xóa. Hiển thị 100 sự kiện gần nhất.
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          {events.length === 0 ? (
            <div className={styles.empty}>Chưa có sự kiện nào được ghi nhận.</div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thực hiện</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>ID đối tượng</th>
                  <th>Lý do</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(e.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {e.actor?.full_name || 'System'}
                    </td>
                    <td>
                      <span style={{ color: actionColor(e.action), fontWeight: 600, fontSize: '0.8rem' }}>
                        {e.action}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeGray}`}>{e.entity_type}</span>
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {e.entity_id?.split('-')[0]}…
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
