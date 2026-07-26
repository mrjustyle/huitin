import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGroupDetail } from '@/features/hui/actions';
import { getReceipts } from '@/features/receipt/actions';
import { getSubscriptionStatus } from '@/features/subscription/actions';
import { createClient } from '@/lib/supabase/server';
import { formatVND } from '@/lib/constants';
import DownloadReceiptButton from './DownloadReceiptButton';
import styles from './page.module.css';

export const metadata = {
  title: 'Biên nhận điện tử',
};

export default async function ReceiptListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const groupData = await getGroupDetail(id);
  if (!groupData || !groupData.group) return notFound();

  const { group, members, isOwner, myMemberIds } = groupData;
  const receipts = await getReceipts(id);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sub = await getSubscriptionStatus(user?.id);
  const isVip = sub.isVip;
  
  const privacyMode = group.privacy_mode === true;

  // Build lookup: member_id → user_id for privacy matching
  const memberUserMap = new Map<string, string>();
  const ownerUserIds = new Set<string>();
  members.forEach((m: any) => {
    memberUserMap.set(m.id, m.user_id);
    if (m.role === 'owner') ownerUserIds.add(m.user_id);
  });

  // Build lookup: myUserIds (user IDs of the current user's memberships)
  const myUserIds = new Set(
    members.filter((m: any) => myMemberIds.includes(m.id)).map((m: any) => m.user_id)
  );

  // Privacy helper for receipt member names
  // Receipts reference members by name, we need to match by member_id in the receipt
  const getReceiptDisplayName = (receipt: any, index: number) => {
    if (!privacyMode || isOwner) return receipt.memberName;
    // Check if this receipt belongs to the current user - match by name against our profile
    // Since receipts don't carry member_id directly, we match by name
    const isMyReceipt = members.some((m: any) => 
      myMemberIds.includes(m.id) && 
      m.user_profiles?.full_name === receipt.memberName
    );
    if (isMyReceipt) return receipt.memberName;
    // Check if it's the owner
    const isOwnerReceipt = members.some((m: any) => 
      m.role === 'owner' && 
      m.user_profiles?.full_name === receipt.memberName
    );
    if (isOwnerReceipt) return receipt.memberName;
    return `Thành viên ẩn danh`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href={`/day-hui/${groupData.group.id}`} className={styles.backLink}>
          ← Quay lại Chi tiết
        </Link>
        <div className={styles.headerMain}>
          <div>
            <h1 className={styles.title}>Biên nhận điện tử</h1>
            <p className={styles.subtitle}>
              Lưu trữ mọi giao dịch tài chính của dây hụi với mã băm toàn vẹn dữ liệu.
            </p>
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
          🔒 Chế độ riêng tư đang bật. Tên thành viên khác được ẩn danh.
        </div>
      )}

      <div className={styles.list}>
        {receipts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Chưa có biên nhận nào được sinh ra.</p>
            <p style={{ fontSize: '0.875rem' }}>Biên nhận sẽ tự động sinh khi Chủ hụi xác nhận đóng hụi hoặc giải ngân.</p>
          </div>
        ) : (
          receipts.map((receipt, idx) => {
            const displayName = getReceiptDisplayName(receipt, idx);
            return (
              <div key={receipt.id} className={styles.receiptCard}>
                <div className={styles.info}>
                  <div className={styles.primaryInfo}>
                    Kỳ {receipt.periodNumber} • {displayName}
                  </div>
                  <div className={styles.secondaryInfo}>
                    <span>{new Date(receipt.createdAt).toLocaleString('vi-VN')}</span>
                    <span>•</span>
                    <span>Mã: {receipt.id.split('-')[0].toUpperCase()}</span>
                  </div>
                </div>
                
                <div className={styles.rightSide}>
                  <div className={`${styles.amount} ${styles[receipt.type]}`}>
                    {receipt.type === 'contribution' ? '+' : '-'}{formatVND(receipt.amount)}
                  </div>
                  <DownloadReceiptButton 
                    receipt={{ ...receipt, memberName: displayName }} 
                    groupName={groupData.group.name} 
                    isVip={isVip}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

