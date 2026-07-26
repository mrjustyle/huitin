'use client';

import { useState } from 'react';
import VietQR from '@/components/ui/VietQR';
import styles from './VipPayment.module.css';

// Config — update these with real bank info
const BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '0389888999',
  accountName: 'HUI TIN JSC',
};

const PLANS = [
  {
    id: 'monthly' as const,
    label: '1 Tháng',
    price: 99000,
    originalPrice: undefined as number | undefined,
    description: 'Thử nghiệm gói VIP',
    badge: undefined as string | undefined,
  },
  {
    id: 'yearly' as const,
    label: '1 Năm',
    price: 990000,
    originalPrice: 1188000,
    description: 'Tiết kiệm 17%',
    badge: 'Phổ biến nhất',
  },
];

interface VipPaymentProps {
  userId: string;
  userCode: string; // email prefix or user ID prefix
}

export default function VipPayment({ userId, userCode }: VipPaymentProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const transferContent = `VIP ${userCode}`.toUpperCase();

  return (
    <div className={styles.paymentSection} id="upgrade">
      <h2 className={styles.paymentTitle}>💳 Thanh toán VIP</h2>
      <p className={styles.paymentDesc}>Quét mã VietQR hoặc chuyển khoản theo thông tin bên dưới</p>

      {/* Plan Selector */}
      <div className={styles.planSelector}>
        {PLANS.map((p) => (
          <button
            key={p.id}
            className={`${styles.planBtn} ${selectedPlan === p.id ? styles.planBtnActive : ''}`}
            onClick={() => setSelectedPlan(p.id as 'monthly' | 'yearly')}
          >
            {p.badge && <span className={styles.planBadge}>{p.badge}</span>}
            <span className={styles.planLabel}>{p.label}</span>
            <span className={styles.planPrice}>
              {new Intl.NumberFormat('vi-VN').format(p.price)} ₫
            </span>
            {p.originalPrice && (
              <span className={styles.planOriginal}>
                <s>{new Intl.NumberFormat('vi-VN').format(p.originalPrice)} ₫</s>
              </span>
            )}
            <span className={styles.planPeriod}>{p.description}</span>
          </button>
        ))}
      </div>

      {/* QR + Transfer Info */}
      <div className={styles.paymentGrid}>
        <div className={styles.qrSection}>
          <VietQR
            bankId={BANK_CONFIG.bankId}
            accountNo={BANK_CONFIG.accountNo}
            accountName={BANK_CONFIG.accountName}
            amount={plan.price}
            content={transferContent}
          />
        </div>

        <div className={styles.transferInfo}>
          <h3 className={styles.transferTitle}>Thông tin chuyển khoản</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Ngân hàng</span>
            <span className={styles.infoValue}>MB Bank (Quân Đội)</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Số tài khoản</span>
            <span className={styles.infoValueMono}>{BANK_CONFIG.accountNo}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Chủ tài khoản</span>
            <span className={styles.infoValue}>{BANK_CONFIG.accountName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Số tiền</span>
            <span className={styles.infoValueHighlight}>
              {new Intl.NumberFormat('vi-VN').format(plan.price)} ₫
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Nội dung CK</span>
            <span className={styles.infoValueCode}>{transferContent}</span>
          </div>

          <div className={styles.note}>
            <p>⚡ Ghi đúng nội dung chuyển khoản để hệ thống tự động kích hoạt VIP.</p>
            <p>⏱️ Thời gian xử lý: tức thì (nếu dùng SePay/Casso) hoặc tối đa 24h (thủ công).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
