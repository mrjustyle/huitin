/**
 * Cashflow Calculator — Pure Functions
 * Tính toán dòng tiền cho dây hụi
 */

export interface CashflowRow {
  periodNumber: number;
  dueDate: string;
  memberPays: number | string;          // Mỗi thành viên đóng
  recipientReceives: number | string;   // Người lĩnh nhận được
  commissionDeducted: number;  // Hoa hồng chủ hụi
  totalCollected: number | string;      // Tổng thu trong kỳ
}

export interface CashflowSummary {
  totalGroupValue: number;     // Tổng giá trị dây hụi
  totalPeriods: number;
  memberPaysPerPeriod: number;
  legalWarning: boolean;       // NĐ 19/2019: > 100 triệu
  rows: CashflowRow[];
}

interface CalcInput {
  shareValue: number;
  totalShares: number;
  cycleType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  paymentDayOfMonth?: number;
  commissionType: 'none' | 'fixed_per_period' | 'fixed_per_payout' | 'percentage';
  commissionAmount: number;
  huiType: 'khong_lai' | 'boc_tham' | 'bo_hui' | 'boc_tham_lai_co_dinh';
  fixedInterestAmount?: number;
}

export function calculateCashflow(input: CalcInput): CashflowSummary {
  const {
    shareValue,
    totalShares,
    cycleType,
    startDate,
    commissionType,
    commissionAmount,
    huiType,
    fixedInterestAmount = 0,
  } = input;

  const totalPeriods = totalShares; // Mỗi thành viên lĩnh 1 lần
  const totalGroupValue = shareValue * totalShares;
  const legalWarning = totalGroupValue >= 100_000_000; // 100 triệu VND

  // Tính ngày cho từng kỳ
  const rows: CashflowRow[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < totalPeriods; i++) {
    const dueDate = getNextDate(start, cycleType, i);

    // Commission per period
    let commission = 0;
    if (commissionType === 'fixed_per_period') {
      commission = commissionAmount;
    } else if (commissionType === 'fixed_per_payout') {
      commission = commissionAmount;
    } else if (commissionType === 'percentage') {
      commission = Math.floor(shareValue * totalShares * (commissionAmount / 100));
    }

    // Hụi không lãi: mỗi người đóng = shareValue, người lĩnh nhận = shareValue * (totalShares - 1)
    // (trừ phần của chính họ + hoa hồng)
    let memberPays: number | string = shareValue;
    let totalCollected: number | string = memberPays * (totalShares - 1); 
    let recipientReceives: number | string = totalCollected - commission;

    if (huiType === 'bo_hui') {
      memberPays = 'Thay đổi theo đấu giá';
      totalCollected = 'Thay đổi theo đấu giá';
      recipientReceives = 'Thay đổi theo đấu giá';
    } else if (huiType === 'boc_tham_lai_co_dinh') {
      const huiSongPays = shareValue - fixedInterestAmount;
      const huiChetPays = shareValue;
      memberPays = `Sống: ${formatVND(huiSongPays)}\nChết: ${formatVND(huiChetPays)}`;
      
      // Tính tương đối người nhận cho từng kỳ (người lĩnh kỳ 1 = toàn bộ hụi sống, người lĩnh cuối = toàn hụi chết)
      // Kỳ i (0-indexed): có i người đã lĩnh (hụi chết) và (totalShares - 1 - i) người hụi sống
      const numHuiChet = i;
      const numHuiSong = totalShares - 1 - i;
      const totalCol = (numHuiChet * huiChetPays) + (numHuiSong * huiSongPays);
      totalCollected = totalCol;
      recipientReceives = totalCol - commission;
    }

    rows.push({
      periodNumber: i + 1,
      dueDate: formatDateISO(dueDate),
      memberPays,
      recipientReceives,
      commissionDeducted: commission,
      totalCollected,
    });
  }

  return {
    totalGroupValue,
    totalPeriods,
    memberPaysPerPeriod: shareValue,
    legalWarning,
    rows,
  };
}

function getNextDate(start: Date, cycleType: string, periodIndex: number): Date {
  const date = new Date(start);

  switch (cycleType) {
    case 'daily':
      date.setDate(date.getDate() + periodIndex);
      break;
    case 'weekly':
      date.setDate(date.getDate() + periodIndex * 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + periodIndex * 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + periodIndex);
      break;
  }

  return date;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
