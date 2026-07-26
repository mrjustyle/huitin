/* Shared constants */

export const APP_NAME = 'Hụi Tín';
export const APP_DESCRIPTION = 'Sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/* Hui Group Status Labels */
export const HUI_STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  recruiting: 'Đang tuyển',
  pending_agreement: 'Chờ ký thỏa thuận',
  ready: 'Sẵn sàng',
  active: 'Đang hoạt động',
  suspended: 'Tạm ngưng',
  in_dispute: 'Có tranh chấp',
  completed: 'Đã hoàn tất',
  cancelled: 'Đã hủy',
};

/* Member Status Labels */
export const MEMBER_STATUS_LABELS: Record<string, string> = {
  invited: 'Đã mời',
  pending_kyc: 'Chờ xác minh',
  pending_approval: 'Chờ duyệt',
  pending_agreement: 'Chờ ký thỏa thuận',
  active: 'Đang tham gia',
  late: 'Đóng trễ',
  suspended: 'Tạm khóa',
  replaced: 'Đã thay thế',
  withdrawn: 'Đã rút',
  removed: 'Đã loại',
  completed: 'Hoàn tất',
};

/* Contribution Status Labels */
export const CONTRIBUTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ đóng',
  proof_submitted: 'Đã gửi chứng từ',
  confirmed: 'Đã xác nhận',
  partially_paid: 'Đóng một phần',
  late: 'Quá hạn',
  disputed: 'Tranh chấp',
  reversed: 'Đã hoàn',
};

/* Cycle Types */
export const CYCLE_LABELS: Record<string, string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  biweekly: 'Hai tuần một lần',
  monthly: 'Hàng tháng',
};

/* Hui Types */
export const HUI_TYPE_LABELS: Record<string, string> = {
  khong_lai: 'Hụi không lãi',
  boc_tham: 'Hụi bốc thăm',
  bo_hui: 'Hụi bỏ (có lãi)',
  boc_tham_lai_co_dinh: 'Hụi bốc thăm (lãi cố định)',
};

/* Payout Methods */
export const PAYOUT_METHOD_LABELS: Record<string, string> = {
  fixed_order: 'Thứ tự cố định',
  draw: 'Bốc thăm',
  auction: 'Bỏ hụi',
};

/* Currency formatter */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/* Date formatter */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
