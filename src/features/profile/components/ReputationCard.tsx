import Badge from '@/components/ui/Badge';
import styles from './ReputationCard.module.css';

interface ReputationProps {
  kycStatus: string;
  totalGroupsCompleted: number;
  onTimeRate: number;
  totalLateCount: number;
  openDisputes: number;
  activeGroupsAsOwner: number;
}

export default function ReputationCard({
  kycStatus,
  totalGroupsCompleted,
  onTimeRate,
  totalLateCount,
  openDisputes,
  activeGroupsAsOwner,
}: ReputationProps) {
  const getReputationLevel = () => {
    if (totalGroupsCompleted === 0) return { label: 'Mới', color: 'default' as const };
    if (onTimeRate >= 95 && totalLateCount === 0 && openDisputes === 0) {
      return { label: 'Xuất sắc', color: 'success' as const };
    }
    if (onTimeRate >= 80 && openDisputes === 0) {
      return { label: 'Tốt', color: 'primary' as const };
    }
    if (onTimeRate >= 60) {
      return { label: 'Trung bình', color: 'warning' as const };
    }
    return { label: 'Cần cải thiện', color: 'error' as const };
  };

  const level = getReputationLevel();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Uy tín</h3>
        <Badge variant={level.color} dot>{level.label}</Badge>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {onTimeRate > 0 ? `${onTimeRate}%` : '—'}
          </div>
          <div className={styles.statLabel}>Đúng hạn</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{totalGroupsCompleted}</div>
          <div className={styles.statLabel}>Dây hoàn tất</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${totalLateCount > 0 ? styles.statWarn : ''}`}>
            {totalLateCount}
          </div>
          <div className={styles.statLabel}>Trễ hạn</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${openDisputes > 0 ? styles.statError : ''}`}>
            {openDisputes}
          </div>
          <div className={styles.statLabel}>Tranh chấp</div>
        </div>
      </div>

      <div className={styles.bar}>
        <div
          className={styles.barFill}
          style={{ width: `${Math.min(onTimeRate, 100)}%` }}
        />
      </div>

      <div className={styles.meta}>
        <span>
          KYC: <KycLabel status={kycStatus} />
        </span>
        <span>
          Đang làm chủ hụi: {activeGroupsAsOwner} dây
        </span>
      </div>
    </div>
  );
}

function KycLabel({ status }: { status: string }) {
  const labels: Record<string, string> = {
    none: 'Chưa xác minh',
    pending: 'Đang xem xét',
    approved: 'Đã xác minh ✓',
    rejected: 'Bị từ chối',
  };
  return <>{labels[status] || status}</>;
}
