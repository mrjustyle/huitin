import { createClient } from '@/lib/supabase/server';
import KycForm from '@/features/kyc/components/KycForm';
import Badge from '@/components/ui/Badge';
import { IconConfirmed, IconPending, IconError } from '@/components/ui/Icons';
import styles from './page.module.css';

export const metadata = {
  title: 'Xác minh danh tính',
};

export default async function KycPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('kyc_status, kyc_submitted_at, kyc_approved_at')
    .eq('id', user.id)
    .single();

  const kycStatus = profile?.kyc_status || 'none';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Xác minh danh tính (KYC)</h1>
          <p className={styles.subtitle}>
            Xác minh để tham gia và tạo dây hụi trên Hụi Tín
          </p>
        </div>
        <KycStatusBadge status={kycStatus} />
      </div>

      {kycStatus === 'approved' && (
        <div className={styles.approvedCard}>
          <div className={styles.approvedIcon} style={{ color: 'var(--success-color)' }}><IconConfirmed size={24} /></div>
          <div>
            <h3>Đã xác minh</h3>
            <p>Danh tính của bạn đã được xác minh thành công. Bạn có thể tạo và tham gia dây hụi.</p>
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <div className={styles.pendingCard}>
          <div className={styles.pendingIcon} style={{ color: 'var(--warning-600)' }}><IconPending size={24} /></div>
          <div>
            <h3>Đang xem xét</h3>
            <p>Thông tin KYC của bạn đang được xem xét. Thường mất 1-2 ngày làm việc.</p>
          </div>
        </div>
      )}

      {kycStatus === 'rejected' && (
        <div className={styles.rejectedCard}>
          <div className={styles.rejectedIcon} style={{ color: 'var(--error-600)' }}><IconError size={24} /></div>
          <div>
            <h3>Cần bổ sung</h3>
            <p>Thông tin không hợp lệ. Vui lòng gửi lại với ảnh rõ ràng hơn.</p>
          </div>
        </div>
      )}

      {(kycStatus === 'none' || kycStatus === 'rejected') && (
        <KycForm />
      )}
    </div>
  );
}

function KycStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
    none: { variant: 'default', label: 'Chưa xác minh' },
    pending: { variant: 'warning', label: 'Đang xem xét' },
    approved: { variant: 'success', label: 'Đã xác minh' },
    rejected: { variant: 'error', label: 'Bị từ chối' },
  };

  const { variant, label } = variants[status] || variants.none;

  return <Badge variant={variant} dot>{label}</Badge>;
}
