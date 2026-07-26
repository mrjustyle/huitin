import { createClient } from '@/lib/supabase/server';
import { joinGroupByInvite } from '@/features/hui/actions';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { HUI_TYPE_LABELS, CYCLE_LABELS, formatVND } from '@/lib/constants';
import JoinButton from './JoinButton';
import styles from './page.module.css';

export const metadata = {
  title: 'Tham gia dây hụi',
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  // Find group by invite code
  const { data: group } = await supabase
    .from('hui_groups')
    .select(`
      id, name, hui_type, share_value, total_shares,
      cycle_type, start_date, status, owner_id,
      user_profiles!hui_groups_owner_id_fkey (full_name)
    `)
    .eq('invite_code', code.toUpperCase())
    .single();

  if (!group || group.status !== 'recruiting') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>❌</div>
          <h1 className={styles.errorTitle}>Mã mời không hợp lệ</h1>
          <p className={styles.errorDesc}>
            Mã mời đã hết hạn, không đúng, hoặc dây hụi không còn nhận thành viên.
          </p>
          <Link href="/" className={styles.homeLink}>← Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const ownerName = (group as any).user_profiles?.full_name || 'Chủ hụi';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardIcon}>🎉</div>
        <h1 className={styles.cardTitle}>Bạn được mời tham gia</h1>

        <div className={styles.groupInfo}>
          <h2 className={styles.groupName}>{group.name}</h2>
          <p className={styles.groupOwner}>Chủ hụi: {ownerName}</p>
          <div className={styles.badges}>
            <Badge variant="primary">{HUI_TYPE_LABELS[group.hui_type]}</Badge>
            <Badge variant="default">{CYCLE_LABELS[group.cycle_type]}</Badge>
          </div>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detail}>
            <span>Phần hụi</span>
            <strong>{formatVND(group.share_value)}</strong>
          </div>
          <div className={styles.detail}>
            <span>Số thành viên</span>
            <strong>{group.total_shares}</strong>
          </div>
          <div className={styles.detail}>
            <span>Tổng giá trị</span>
            <strong>{formatVND(group.share_value * group.total_shares)}</strong>
          </div>
          <div className={styles.detail}>
            <span>Ngày bắt đầu</span>
            <strong>{new Date(group.start_date).toLocaleDateString('vi-VN')}</strong>
          </div>
        </div>

        <JoinButton inviteCode={code.toUpperCase()} />

        <p className={styles.note}>
          Bạn cần đăng nhập và xác minh KYC trước khi tham gia dây hụi.
        </p>
      </div>
    </div>
  );
}
