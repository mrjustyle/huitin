import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGroupDetail } from '@/features/hui/actions';
import { getDisputes } from '@/features/period/actions';
import ResolveDisputeClient from './ResolveDisputeClient';
import styles from './page.module.css';

export const metadata = {
  title: 'Quản lý Khiếu nại',
};

export default async function DisputesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupData = await getGroupDetail(id);
  
  if (!groupData) notFound();
  
  const { group, isOwner } = groupData;
  const disputes = await getDisputes(id);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href={`/day-hui/${id}`} className={styles.backLink}>← Quay lại Chi tiết</Link>
        <h1 className={styles.title}>Quản lý Khiếu nại</h1>
        <p className={styles.subtitle}>Danh sách các báo cáo sự cố và khiếu nại trong dây hụi "{group.name}".</p>
      </div>

      <div className={styles.disputeList}>
        {disputes.length === 0 ? (
          <div className={styles.empty}>
            <p>Tuyệt vời! Dây hụi này chưa có bất kỳ khiếu nại nào.</p>
          </div>
        ) : (
          disputes.map((dispute: any) => (
            <div key={dispute.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.reporter}>
                  {dispute.reporter?.avatar_url ? (
                    <img src={dispute.reporter.avatar_url} alt="Avatar" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {dispute.reporter?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className={styles.reporterInfo}>
                    <h4>{dispute.reporter?.full_name || 'Thành viên'}</h4>
                    <p>Báo cáo lúc: {new Date(dispute.created_at).toLocaleString('vi-VN')} • Kỳ {dispute.period?.period_number}</p>
                  </div>
                </div>
                <div className={`${styles.status} ${dispute.status === 'open' ? styles.statusOpen : styles.statusResolved}`}>
                  {dispute.status === 'open' ? 'Đang mở' : 'Đã giải quyết'}
                </div>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.label}>Nội dung khiếu nại</span>
                <div className={styles.reason}>
                  {dispute.reason}
                </div>

                {dispute.evidence_url && (
                  <div className={styles.evidence}>
                    <span className={styles.label}>Bằng chứng (Hình ảnh/Link)</span>
                    <a href={dispute.evidence_url} target="_blank" rel="noopener noreferrer" className={styles.evidenceLink}>
                      🔗 Nhấn vào đây để xem bằng chứng
                    </a>
                  </div>
                )}

                {dispute.status === 'resolved' && dispute.admin_note && (
                  <div className={styles.adminNote}>
                    <span className={styles.label}>Ghi chú giải quyết của Chủ hụi</span>
                    <p>{dispute.admin_note}</p>
                  </div>
                )}
              </div>

              {dispute.status === 'open' && isOwner && (
                <div className={styles.cardActions}>
                  <ResolveDisputeClient disputeId={dispute.id} periodId={dispute.period_id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
