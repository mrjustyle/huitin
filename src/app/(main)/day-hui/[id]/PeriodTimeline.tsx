'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { formatVND } from '@/lib/constants';
import styles from './PeriodTimeline.module.css';

interface PeriodTimelineProps {
  groupId: string;
  periods: any[];
  huiType?: string;
}

export default function PeriodTimeline({ groupId, periods, huiType }: PeriodTimelineProps) {
  if (!periods || periods.length === 0) {
    return <div className={styles.empty}>Chưa có thông tin kỳ hụi</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Lịch Trình Đóng Hụi</h2>
      <div className={styles.timeline}>
        {periods.map((p) => {
          const isActive = p.status === 'payment_open' || p.status === 'payout_pending' || p.status === 'draw_pending';
          const isPast = p.status === 'completed' || p.status === 'payout_confirmed';
          
          return (
            <Link 
              href={`/day-hui/${groupId}/ky/${p.id}`} 
              key={p.id} 
              className={`${styles.item} ${isActive ? styles.activeItem : ''} ${isPast ? styles.pastItem : ''}`}
            >
              <div className={styles.itemHeader}>
                <span className={styles.periodName}>Kỳ {p.period_number}</span>
                <Badge variant={
                  p.status === 'payment_open' ? 'warning' :
                  p.status === 'draw_pending' ? 'info' :
                  p.status === 'completed' || p.status === 'payout_confirmed' ? 'success' : 'default'
                } size="sm">
                  {({
                    upcoming: 'Sắp tới',
                    draw_pending: huiType === 'bo_hui' ? '⚖️ Đấu thảo' : '🎲 Bốc thăm',
                    payment_open: 'Đang thu',
                    completed: 'Đã thu đủ',
                    payout_pending: 'Chờ giải ngân',
                    payout_confirmed: 'Đã xong',
                    disputed: 'Tranh chấp',
                  } as Record<string, string>)[p.status] || p.status}
                </Badge>
              </div>
              <div className={styles.itemBody}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Hạn đóng:</span>
                  <span className={styles.value}>
                    {new Date(p.payment_due_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Tổng thu:</span>
                  <span className={styles.value}>{formatVND(p.payout_amount || 0)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
