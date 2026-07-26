'use client';

import { formatVND } from '@/lib/constants';
import styles from './PersonalPnL.module.css';

export default function PersonalPnL({ group, periods, myMemberIds, myContributions }: any) {
  if (!myMemberIds || myMemberIds.length === 0) return null;

  // 1. Tổng tiền đã đóng
  const totalPaid = myContributions.reduce((sum: number, c: any) => sum + (Number(c.amount_paid) || 0), 0);

  // 2. Tổng tiền đã lĩnh
  const myPayoutPeriods = periods.filter(
    (p: any) => myMemberIds.includes(p.payout_member_id) && 
                (p.status === 'payout_confirmed' || p.status === 'completed' || p.status === 'payout_pending')
  );
  
  const totalReceived = myPayoutPeriods.reduce((sum: number, p: any) => sum + (Number(p.payout_amount) || 0) - (Number(p.commission_amount) || 0), 0);

  const wonSlots = myPayoutPeriods.length;
  const isAllWon = wonSlots === myMemberIds.length;
  const hasWonAny = wonSlots > 0;

  // 3. Lãi / Lỗ
  let pnlValue = 0;
  let pnlLabel = '';

  if (hasWonAny) {
    if (isAllWon) {
      // Đã hốt hết các phần: Tính chính xác Lãi/Lỗ chung cuộc
      // Phí các kỳ sau = (Tổng số phần * số phần của mình - Số lần đã đóng) * share_value
      const periodsPaidByMe = myContributions.length;
      const remainingContributions = (group.total_shares * myMemberIds.length) - periodsPaidByMe;
      // Dù hụi thảo hay hụi gì, sau khi hốt thì các kỳ sau đóng hụi chết (bằng đúng share_value)
      const futureCost = remainingContributions * Number(group.share_value);
      const totalCost = totalPaid + futureCost;
      
      pnlValue = totalReceived - totalCost;
      pnlLabel = 'Lãi/Lỗ chung cuộc';
    } else {
      // Hốt 1 phần, chưa hốt phần khác (Nếu user chơi nhiều phần) -> Tạm tính dòng tiền
      pnlValue = totalReceived - totalPaid;
      pnlLabel = 'Dòng tiền hiện tại';
    }
  } else {
    // Chưa hốt (Hụi sống)
    pnlValue = -totalPaid; // Đang âm tiền do mới chỉ đóng
    pnlLabel = 'Dòng tiền hiện tại';
  }

  // 4. Dự kiến lĩnh (Nếu chưa lĩnh)
  let expectedPayoutStr = 'Chưa lĩnh';
  let maxExpectedNet = 0;
  if (!hasWonAny) {
    const maxExpected = Number(group.share_value) * group.total_shares;
    
    let commission = 0;
    if (group.commission_type === 'fixed_per_payout' || group.commission_type === 'fixed_per_period') {
      commission = Number(group.commission_amount) || 0;
    } else if (group.commission_type === 'percentage') {
      commission = Math.floor(maxExpected * (Number(group.commission_amount) || 0) / 100);
    }
    maxExpectedNet = maxExpected - commission;

    if (group.hui_type === 'khong_lai') {
      expectedPayoutStr = formatVND(maxExpectedNet);
    } else if (group.hui_type === 'bo_hui') {
      expectedPayoutStr = `Tùy giá đấu`;
    } else {
      expectedPayoutStr = formatVND(maxExpectedNet);
    }
  } else {
    expectedPayoutStr = formatVND(totalReceived);
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Thống kê cá nhân</h3>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>Tổng đã đóng</div>
          <div className={styles.value}>{formatVND(totalPaid)}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>{hasWonAny ? 'Tổng đã lĩnh' : 'Dự kiến lĩnh'}</div>
          <div className={`${styles.value} ${hasWonAny ? styles.textSuccess : ''}`}>
            {expectedPayoutStr}
          </div>
          {!hasWonAny && group.hui_type === 'bo_hui' && (
            <div className={styles.hint}>Tối đa: {formatVND(maxExpectedNet)} (Nếu bỏ thăm 0đ)</div>
          )}
        </div>
        <div className={`${styles.card} ${pnlValue > 0 ? styles.bgSuccess : pnlValue < 0 ? styles.bgDanger : ''}`}>
          <div className={styles.label}>{pnlLabel}</div>
          <div className={`${styles.value} ${pnlValue > 0 ? styles.textSuccess : pnlValue < 0 ? styles.textDanger : ''}`}>
            {pnlValue > 0 ? '+' : ''}{formatVND(pnlValue)}
          </div>
          {isAllWon && (
            <div className={styles.hint}>Đã trừ tiền hụi chết các kỳ sau</div>
          )}
          {!hasWonAny && (
            <div className={styles.hint}>Đang trong giai đoạn tích lũy</div>
          )}
        </div>
      </div>
    </div>
  );
}
