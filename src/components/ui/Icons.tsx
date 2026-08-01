import React from 'react';

// Cấu hình chung cho toàn bộ Icon System
const STROKE_WIDTH = 1.75;
const SIZE = 24;

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// 1. Biểu tượng thương hiệu (Brand / Hụi Tín Logo)
// Một vòng tròn đại diện cho vòng hụi. Nhiều điểm nhỏ đại diện cho các thành viên kết nối theo chu kỳ. Chữ T cách điệu (hoặc Check) ở trung tâm.
export const IconBrand = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Outer circle representing the Trust Circle */}
    <circle cx="12" cy="12" r="9" />
    {/* Nodes on the circle (8 nodes for 8 points) */}
    <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18.36" cy="5.64" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="21" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18.36" cy="18.36" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="5.64" cy="18.36" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="5.64" cy="5.64" r="1.5" fill="currentColor" stroke="none" />
    
    {/* The elegant 'T' in the center */}
    <path d="M8 9h8" strokeWidth="2" />
    <path d="M12 9v7" strokeWidth="2" />
    <path d="M12 16h1.5" strokeWidth="2" /> 
  </svg>
);

// 2. Trang chủ (Home)
// Hình học rõ ràng, tối giản, có một đường cắt tinh tế (negative space).
export const IconHome = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 10L12 3l8 7" />
    {/* Đường cắt ở đáy */}
    <path d="M5 10v9a2 2 0 0 0 2 2h3v-5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5h3a2 2 0 0 0 2-2v-9" />
    <circle cx="12" cy="9" r="1" fill="var(--primary)" stroke="none" />
  </svg>
);

// 3. Dây hụi (Cycle / Group)
// Vòng tròn gồm nhiều node, một node nổi bật, đường kết nối đơn giản.
export const IconCycle = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Quỹ đạo */}
    <path d="M12 4a8 8 0 1 1-8 8" strokeDasharray="4 4" />
    {/* Node nổi bật (kỳ hiện tại) - Accent */}
    <circle cx="12" cy="4" r="2.5" fill="var(--primary)" stroke="none" />
    {/* Các node khác */}
    <circle cx="20" cy="12" r="1.5" />
    <circle cx="12" cy="20" r="1.5" />
    <circle cx="4" cy="12" r="1.5" />
  </svg>
);

// 4. Đóng hụi (Payment / Deposit)
// Ký hiệu tiền đưa vào vòng tròn, có dấu kiểm nhỏ (không dùng túi tiền).
export const IconPayment = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Vòng tròn bên ngoài */}
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    {/* Đồng tiền đi vào - Accent */}
    <circle cx="12" cy="10" r="4" stroke="var(--primary)" />
    <path d="M12 8v4" />
    {/* Mũi tên chỉ xuống */}
    <path d="M12 2v2" />
    <path d="M10 4l2 2 2-2" />
    {/* Dấu kiểm nhỏ */}
    <path d="M16 19l2 2 4-4" />
  </svg>
);

// 5. Thành viên (Members)
// Avatar tối giản xếp vòng cung.
export const IconMembers = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Người trung tâm - Accent */}
    <circle cx="12" cy="9" r="3" stroke="var(--primary)" />
    <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="var(--primary)" />
    {/* Người phụ bên trái (negative space) */}
    <circle cx="6" cy="10" r="2.5" />
    <path d="M3 19c0-2 1.2-3.8 3-4.5" />
    {/* Người phụ bên phải */}
    <circle cx="18" cy="10" r="2.5" />
    <path d="M18 14.5c1.8.7 3 2.5 3 4.5" />
  </svg>
);

// 6. Đã xác nhận (Confirmed)
// Dấu kiểm nằm trong vòng tròn kết nối, motif tương lai.
export const IconConfirmed = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Vòng tròn đứt đoạn tinh tế */}
    <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2" />
    <path d="M17 3.5a10 10 0 0 1 4.5 8.5" />
    {/* Dấu kiểm - Accent */}
    <path d="M8 12l3 3 7-7" stroke="var(--primary)" />
    {/* Node kết nối nhỏ */}
    <circle cx="21.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
  </svg>
);

// --- ĐIỀU HƯỚNG CHÍNH ---

export const IconTransaction = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 16V4m0 0L4 7m3-3l3 3" />
    <path d="M17 8v12m0 0l3-3m-3 3l-3-3" />
  </svg>
);

export const IconNotification = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const IconAccount = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    {/* Điểm nhấn - Accent */}
    <circle cx="12" cy="12" r="1" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconCreateGroup = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeDasharray="6 6" />
    {/* Dấu cộng - Accent */}
    <path d="M12 8v8" stroke="var(--primary)" />
    <path d="M8 12h8" stroke="var(--primary)" />
  </svg>
);

// --- QUẢN LÝ DÂY HỤI ---

export const IconPeriod = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="var(--primary)" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="var(--primary)" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="15" r="2" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconLedger = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M9 7h6" />
    <path d="M9 11h6" />
    {/* Dấu kiểm - Accent */}
    <path d="M16 11l2 2 3-3" stroke="var(--primary)" />
  </svg>
);

export const IconAgreement = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

// --- THANH TOÁN & GIAO DỊCH ---

export const IconPayout = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 1 0 2.6-6.4" />
    {/* Đồng tiền đi ra - Accent */}
    <circle cx="12" cy="14" r="4" stroke="var(--primary)" />
    <path d="M12 10V6" />
    <path d="M12 22v-2" />
    {/* Mũi tên chỉ lên - Accent */}
    <path d="M10 4l2-2 2 2" stroke="var(--primary)" />
  </svg>
);

export const IconReceipt = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2H4z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    {/* Line cuối - Accent */}
    <path d="M8 15h4" stroke="var(--primary)" />
  </svg>
);

// --- TRẠNG THÁI THÀNH VIÊN ---

export const IconOverdue = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

// --- HỆ THỐNG ---

export const IconSettings = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    {/* Tròn giữa - Accent */}
    <circle cx="12" cy="12" r="3" stroke="var(--primary)" />
  </svg>
);

export const IconSearch = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    {/* Kính lúp - Accent */}
    <path d="M21 21l-4.35-4.35" stroke="var(--primary)" />
  </svg>
);

export const IconFilter = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    {/* Dấu chấm phẩy - Accent */}
    <circle cx="12" cy="19" r="1" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconSort = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 18H3M21 6H3" />
    <path d="M17 12H3" stroke="var(--primary)" />
  </svg>
);

export const IconSecurity = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="2" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconWarning = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const IconInfo = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const IconSuccess = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-6" />
  </svg>
);

export const IconError = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

export const IconLogout = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    {/* Mũi tên - Accent */}
    <path d="M16 17l5-5-5-5M21 12H9" stroke="var(--primary)" />
  </svg>
);

export const IconUpload = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

export const IconCopy = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Box trước - Accent */}
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="var(--primary)" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconBank = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
    {/* Vạch ngang - Accent */}
    <line x1="2" y1="10" x2="22" y2="10" stroke="var(--primary)" />
  </svg>
);

export const IconQR = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Các ô vuông mã - Accent ô đầu */}
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="var(--primary)" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h7v7h-7zM14 17h7M17 14v7" />
  </svg>
);

// --- TRẠNG THÁI & CHỨC NĂNG KHÁC ---

export const IconPaid = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconUnpaid = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeDasharray="4 4" />
    <path d="M8 12h8" />
  </svg>
);

export const IconNewMember = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    {/* Dấu cộng - Accent */}
    <path d="M19 8v4M17 10h4" stroke="var(--primary)" />
  </svg>
);

export const IconOwner = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    {/* Vương miện - Accent */}
    <path d="M9 3l3-2 3 2v2H9V3z" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconVerified = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    <path d="M16 12l2 2 4-4" />
    <circle cx="18" cy="12" r="5" strokeDasharray="2 2" />
  </svg>
);

export const IconSuspended = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export const IconDisputed = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    <path d="M21 16l-3-6-3 6h6z" />
    <path d="M18 12v2M18 15h.01" />
  </svg>
);

export const IconRecipient = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    {/* Mũi tên - Accent */}
    <path d="M22 10l-4 4-4-4M18 14V4" stroke="var(--primary)" />
  </svg>
);

export const IconInvite = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    {/* Dấu cộng - Accent */}
    <path d="M20 8v6M17 11h6" stroke="var(--primary)" />
  </svg>
);

export const IconRules = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 10h6" />
    <path d="M9 14h6" stroke="var(--primary)" />
  </svg>
);

export const IconCompleted = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const IconPaused = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="10" y1="9" x2="10" y2="15" />
    <line x1="14" y1="9" x2="14" y2="15" />
  </svg>
);

export const IconPaymentCalendar = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    {/* Checkmark trong lịch - Accent */}
    <path d="M9 16l2 2 4-4" stroke="var(--primary)" />
  </svg>
);

export const IconProgress = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22a10 10 0 1 1 10-10" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="2 4" />
    {/* Chấm tròn - Accent */}
    <circle cx="12" cy="12" r="2" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconReconciliation = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12l2 2 4-4" stroke="var(--primary)" />
    <path d="M14 12l2 2 4-4" />
    <path d="M2 18h20" />
  </svg>
);

export const IconPending = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const IconFailed = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

export const IconRefund = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    {/* Chấm tròn - Accent */}
    <circle cx="12" cy="12" r="2" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconMoon = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <circle cx="15" cy="8" r="1.5" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconSun = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="5" stroke="var(--primary)" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

export const IconHelp = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    {/* Chấm tròn - Accent */}
    <circle cx="12" cy="17" r="1" fill="var(--primary)" stroke="none" />
  </svg>
);

export const IconOTP = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.85 12.15l9.15-9.15" />
    {/* Chấm nhỏ - Accent */}
    <path d="M16 6l1 1M18 4l1 1" stroke="var(--primary)" />
  </svg>
);

export const IconDevice = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <circle cx="12" cy="18" r="1" fill="var(--primary)" stroke="none" />
  </svg>
);

// KPI Dashboard Icons
export const IconTrendUp = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export const IconTrendDown = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);

export const IconCashOut = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2v14m0 0l-4-4m4 4l4-4" />
    <path d="M2 20h20" />
  </svg>
);

export const IconCashIn = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22V8m0 0l-4 4m4-4l4 4" />
    <path d="M2 4h20" />
  </svg>
);

export const IconChart = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

export const IconDonut = ({ size = SIZE, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2a10 10 0 0 1 8.66 5" stroke="var(--primary)" />
  </svg>
);
