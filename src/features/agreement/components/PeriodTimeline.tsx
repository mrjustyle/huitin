import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/constants';
import styles from './PeriodTimeline.module.css';

interface Period {
  id: string;
  period_number: number;
  payment_due_date: string;
  grace_deadline: string;
  status: string;
  payout_member_id: string | null;
  payout_amount: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'; icon: string }> = {
  upcoming: { label: 'Sắp tới', variant: 'default', icon: '⏳' },
  payment_open: { label: 'Đang đóng', variant: 'info', icon: '💳' },
  draw_pending: { label: 'Chờ bốc thăm', variant: 'warning', icon: '🎲' },
  payout_pending: { label: 'Chờ giao tiền', variant: 'warning', icon: '💰' },
  payout_confirmed: { label: 'Đã giao', variant: 'primary', icon: '✅' },
  completed: { label: 'Hoàn tất', variant: 'success', icon: '✓' },
  disputed: { label: 'Tranh chấp', variant: 'error', icon: '⚠' },
};

export default function PeriodTimeline({ periods }: { periods: Period[] }) {
  if (periods.length === 0) {
    return (
      <div className={styles.empty}>
        Chưa có kỳ hụi nào. Kích hoạt dây hụi để bắt đầu.
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {periods.map((p, i) => {
        const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.upcoming;
        const isActive = p.status === 'payment_open';
        const isPast = p.status === 'completed' || p.status === 'payout_confirmed';

        return (
          <div
            key={p.id}
            className={`${styles.item} ${isActive ? styles.itemActive : ''} ${isPast ? styles.itemDone : ''}`}
          >
            <div className={styles.line}>
              <div className={`${styles.dot} ${isActive ? styles.dotActive : ''} ${isPast ? styles.dotDone : ''}`}>
                {isPast ? '✓' : config.icon}
              </div>
              {i < periods.length - 1 && <div className={`${styles.connector} ${isPast ? styles.connectorDone : ''}`} />}
            </div>
            <div className={styles.content}>
              <div className={styles.header}>
                <span className={styles.periodNum}>Kỳ {p.period_number}</span>
                <Badge variant={config.variant} size="sm">{config.label}</Badge>
              </div>
              <div className={styles.date}>
                {formatDate(p.payment_due_date)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
