import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGroupDetail } from '@/features/hui/actions';
import { getMatrixLedgerData, getLedgerData } from '@/features/receipt/actions';
import { getSubscriptionStatus } from '@/features/subscription/actions';
import { createClient } from '@/lib/supabase/server';
import { formatVND } from '@/lib/constants';
import Badge from '@/components/ui/Badge';
import ExportButtons from './ExportButtons';
import styles from './page.module.css';

export const metadata = {
  title: 'Sổ Hụi Điện Tử',
};

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getGroupDetail(id);
  
  if (!data) notFound();
  
  const { group, members, isOwner, myMemberIds } = data;
  const matrix = await getMatrixLedgerData(id);
  const flatData = await getLedgerData(id);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sub = await getSubscriptionStatus(user?.id);
  const isVip = sub.isVip;

  const privacyMode = group.privacy_mode === true;

  // Build a set of owner member IDs for privacy logic
  const ownerMemberIds = new Set(
    members.filter((m: any) => m.role === 'owner').map((m: any) => m.id)
  );

  // Privacy helper: anonymize member names
  const getDisplayName = (member: { id: string; name: string }, index: number) => {
    if (!privacyMode || isOwner) return member.name;
    if (myMemberIds.includes(member.id)) return member.name;
    if (ownerMemberIds.has(member.id)) return member.name;
    return `Thành viên #${index + 1}`;
  };

  // Apply privacy to matrix members for export (already anonymized names)
  const displayMembers = matrix.members.map((m, idx) => ({
    ...m,
    displayName: getDisplayName(m, idx),
    isMe: myMemberIds.includes(m.id),
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href={`/day-hui/${id}`} className={styles.backLink}>← Quay lại Chi tiết</Link>
        <div className={styles.headerMain}>
          <div>
            <h1 className={styles.title}>Sổ Hụi: {group.name}</h1>
            <p className={styles.subtitle}>Ghi nhận toàn bộ lịch sử đóng/lĩnh hụi của dây.</p>
          </div>
          <div className={styles.headerActions}>
            <ExportButtons data={flatData} groupName={group.name} isVip={isVip} />
          </div>
        </div>
      </div>

      {/* Privacy mode notice */}
      {privacyMode && !isOwner && (
        <div style={{ 
          marginBottom: '1rem', padding: '0.75rem 1rem', 
          background: 'rgba(22, 160, 133, 0.05)', borderRadius: '10px', 
          border: '1px solid rgba(22, 160, 133, 0.15)', 
          fontSize: '0.85rem', color: 'var(--text-secondary)', 
          display: 'flex', alignItems: 'center', gap: '8px' 
        }}>
          🔒 Chế độ riêng tư đang bật. Bạn chỉ thấy tên của mình và chủ hụi, các thành viên khác hiển thị ẩn danh.
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-secondary)', minWidth: 150 }}>Thành viên</th>
                {matrix.periods.map(p => (
                  <th key={p.id} style={{ minWidth: 100, textAlign: 'center' }}>
                    Kỳ {p.number}
                    <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                      {p.status === 'upcoming' ? 'Chưa tới' : p.status === 'completed' || p.status === 'payout_confirmed' ? 'Xong' : 'Đang chạy'}
                    </div>
                  </th>
                ))}
                <th style={{ textAlign: 'right', background: 'rgba(16, 185, 129, 0.05)' }}>Tổng đã đóng</th>
                <th style={{ textAlign: 'right', background: 'rgba(59, 130, 246, 0.05)' }}>Tổng đã nhận</th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((member, idx) => {
                let totalPaid = 0;
                let totalReceived = 0;

                return (
                  <tr key={member.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-secondary)', fontWeight: 500 }}>
                      {member.displayName}
                      {member.isMe && privacyMode && !isOwner && (
                        <span style={{ color: '#0d9488', fontSize: '0.75rem', marginLeft: 6 }}>(Bạn)</span>
                      )}
                      {member.shares > 1 && <span style={{ marginLeft: 6 }}><Badge size="sm">{member.shares} phần</Badge></span>}
                    </td>
                    
                    {matrix.periods.map(p => {
                      const contrib = matrix.contributions[member.id]?.[p.id];
                      const payout = matrix.payouts[member.id]?.[p.id];

                      let content = <span style={{ color: 'var(--text-muted)' }}>-</span>;
                      
                      if (payout && payout.status === 'payout_confirmed') {
                        totalReceived += payout.amount;
                        content = <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Lĩnh: {formatVND(payout.amount)}</span>;
                      } else if (contrib) {
                        if (contrib.status === 'confirmed') {
                          totalPaid += contrib.amount;
                          content = <span style={{ color: 'var(--success-color)' }}>Đóng: {formatVND(contrib.amount)}</span>;
                        } else {
                          content = <span style={{ color: 'var(--warning-color)' }}>Chưa đóng</span>;
                        }
                      } else if (p.status === 'upcoming') {
                        content = <span style={{ color: 'var(--text-muted)' }}>-</span>;
                      }

                      return (
                        <td key={p.id} style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                          {content}
                        </td>
                      );
                    })}

                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.05)' }}>
                      {formatVND(totalPaid)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.05)' }}>
                      {formatVND(totalReceived)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
