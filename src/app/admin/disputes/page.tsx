import { getOpenDisputes } from '@/features/admin/actions';
import AdminResolveDispute from './AdminResolveDispute';
import styles from '@/app/admin/layout.module.css';

export const metadata = { title: 'Quản lý Khiếu nại — Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminDisputesPage() {
  const disputes = await getOpenDisputes();

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>⚠️ Khiếu nại đang mở</h1>
        <p className={styles.pageSubtitle}>
          Xem xét và giải quyết các tranh chấp nội bộ dây hụi. Tổng: {disputes.length} khiếu nại.
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className={styles.empty} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          🎉 Không có khiếu nại nào đang mở!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {disputes.map((d: any) => (
            <div key={d.id} className={styles.tableCard}>
              <div className={styles.tableCardHeader}>
                <div>
                  <h3 className={styles.tableCardTitle} style={{ marginBottom: 4 }}>
                    Dây: {d.group?.name || '—'} — Kỳ {d.period?.period_number || '?'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Người báo cáo: <strong>{d.reporter?.full_name || 'Không rõ'}</strong> •{' '}
                    {new Date(d.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className={`${styles.badge} ${styles.badgeRed}`}>Đang mở</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  {d.reason}
                </p>
                {d.evidence_url && (
                  <p style={{ margin: '0 0 16px', fontSize: '0.875rem' }}>
                    🔗{' '}
                    <a href={d.evidence_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      Xem bằng chứng
                    </a>
                  </p>
                )}
                <AdminResolveDispute disputeId={d.id} periodId={d.period_id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
