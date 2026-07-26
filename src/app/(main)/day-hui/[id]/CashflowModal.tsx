'use client';

import { useState } from 'react';
import { calculateCashflow, type CashflowSummary } from '@/features/hui/cashflow';
import { formatVND } from '@/lib/constants';
import styles from './CashflowModal.module.css';

interface CashflowModalProps {
  group: {
    name: string;
    share_value: number;
    total_shares: number;
    cycle_type: string;
    start_date: string;
    commission_type: string;
    commission_amount: number;
    hui_type: string;
  };
  periods?: any[];
}

function mergePeriods(rows: any[], periods: any[], group: any) {
  if (!periods || periods.length === 0) return rows;
  return rows.map(row => {
    const actualPeriod = periods.find(p => p.period_number === row.periodNumber);
    if (actualPeriod && actualPeriod.winning_bid_amount !== null && group.hui_type === 'bo_hui') {
      const actualPays = group.share_value - actualPeriod.winning_bid_amount;
      return {
        ...row,
        memberPays: actualPays,
        recipientReceives: (actualPeriod.payout_amount || 0) - (actualPeriod.commission_amount || 0),
        totalCollected: actualPeriod.payout_amount || 0
      };
    }
    return row;
  });
}

export default function CashflowModal({ group, periods }: CashflowModalProps) {
  const [open, setOpen] = useState(false);

  let cashflow: CashflowSummary = calculateCashflow({
    shareValue: group.share_value,
    totalShares: group.total_shares,
    cycleType: group.cycle_type as any,
    startDate: group.start_date,
    commissionType: group.commission_type as any,
    commissionAmount: group.commission_amount || 0,
    huiType: group.hui_type as any,
  });

  cashflow.rows = mergePeriods(cashflow.rows, periods || [], group);

  function handleExportCSV() {
    const headers = ['Kỳ', 'Ngày đóng', 'Đóng/người', 'Người lĩnh nhận', 'Hoa hồng', 'Tổng thu'];
    const rows = cashflow.rows.map((r) => [
      r.periodNumber,
      r.dueDate,
      r.memberPays,
      r.recipientReceives,
      r.commissionDeducted,
      r.totalCollected,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dong-tien-${group.name.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📊 Dòng tiền: {group.name}</h2>
          <button onClick={() => setOpen(false)} className={styles.closeBtn}>✕</button>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span>Phần hụi</span>
            <strong>{formatVND(group.share_value)}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Số kỳ</span>
            <strong>{cashflow.totalPeriods}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Tổng giá trị</span>
            <strong className={styles.highlight}>{formatVND(cashflow.totalGroupValue)}</strong>
          </div>
        </div>

        {cashflow.legalWarning && (
          <div className={styles.warning}>
            ⚖️ Dây hụi ≥ 100 triệu VND — Nghị định 19/2019 yêu cầu thông báo UBND xã.
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Kỳ</th>
                <th>Ngày đóng</th>
                <th>Đóng/người</th>
                <th>Người lĩnh nhận</th>
                {cashflow.rows[0]?.commissionDeducted > 0 && <th>Hoa hồng</th>}
              </tr>
            </thead>
            <tbody>
              {cashflow.rows.map((row) => (
                <tr key={row.periodNumber}>
                  <td>{row.periodNumber}</td>
                  <td>{new Date(row.dueDate).toLocaleDateString('vi-VN')}</td>
                  <td>{typeof row.memberPays === 'number' ? formatVND(row.memberPays) : row.memberPays}</td>
                  <td className={styles.highlight}>{typeof row.recipientReceives === 'number' ? formatVND(row.recipientReceives) : row.recipientReceives}</td>
                  {row.commissionDeducted > 0 && <td>{formatVND(row.commissionDeducted)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.actions}>
          <button onClick={handleExportCSV} className={styles.exportBtn}>
            📥 Xuất CSV
          </button>
          <button onClick={() => setOpen(false)} className={styles.closeAction}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Expose toggle function via ref-like pattern
export function CashflowButton({ group, periods }: CashflowModalProps) {
  const [open, setOpen] = useState(false);

  let cashflow: CashflowSummary = calculateCashflow({
    shareValue: group.share_value,
    totalShares: group.total_shares,
    cycleType: group.cycle_type as any,
    startDate: group.start_date,
    commissionType: group.commission_type as any,
    commissionAmount: group.commission_amount || 0,
    huiType: group.hui_type as any,
  });

  cashflow.rows = mergePeriods(cashflow.rows, periods || [], group);

  function handleExportCSV() {
    const headers = ['Kỳ', 'Ngày đóng', 'Đóng/người', 'Người lĩnh nhận', 'Hoa hồng', 'Tổng thu'];
    const rows = cashflow.rows.map((r) => [
      r.periodNumber,
      r.dueDate,
      r.memberPays,
      r.recipientReceives,
      r.commissionDeducted,
      r.totalCollected,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dong-tien-${group.name.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button className={styles.actionItem} onClick={() => setOpen(true)}>
        <span className={styles.actionIcon}>📊</span>
        <span>Xem dòng tiền</span>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📊 Dòng tiền: {group.name}</h2>
              <button onClick={() => setOpen(false)} className={styles.closeBtn}>✕</button>
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span>Phần hụi</span>
                <strong>{formatVND(group.share_value)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Số kỳ</span>
                <strong>{cashflow.totalPeriods}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Tổng giá trị</span>
                <strong className={styles.highlight}>{formatVND(cashflow.totalGroupValue)}</strong>
              </div>
            </div>

            {cashflow.legalWarning && (
              <div className={styles.warning}>
                ⚖️ Dây hụi ≥ 100 triệu VND — Nghị định 19/2019 yêu cầu thông báo UBND xã.
              </div>
            )}

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Kỳ</th>
                    <th>Ngày đóng</th>
                    <th>Đóng/người</th>
                    <th>Người lĩnh nhận</th>
                    {cashflow.rows[0]?.commissionDeducted > 0 && <th>Hoa hồng</th>}
                  </tr>
                </thead>
                <tbody>
                  {cashflow.rows.map((row) => (
                    <tr key={row.periodNumber}>
                      <td>{row.periodNumber}</td>
                      <td>{new Date(row.dueDate).toLocaleDateString('vi-VN')}</td>
                      <td>{typeof row.memberPays === 'number' ? formatVND(row.memberPays) : row.memberPays}</td>
                      <td className={styles.highlight}>{typeof row.recipientReceives === 'number' ? formatVND(row.recipientReceives) : row.recipientReceives}</td>
                      {row.commissionDeducted > 0 && <td>{formatVND(row.commissionDeducted)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.actions}>
              <button onClick={handleExportCSV} className={styles.exportBtn}>
                📥 Xuất CSV
              </button>
              <button onClick={() => setOpen(false)} className={styles.closeAction}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
