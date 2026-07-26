'use client';

import { useState } from 'react';
import styles from './VietQR.module.css';
import { BANK_LIST } from '@/features/profile/components/bankData';

interface VietQRProps {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
}

function getBankName(bin: string): string {
  const bank = BANK_LIST.find(b => b.bin === bin);
  return bank ? bank.shortName : bin;
}

export default function VietQR({ bankId, accountNo, accountName, amount, content }: VietQRProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // img.vietqr.io format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<ACCOUNT_NAME>
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
  const bankName = getBankName(bankId);

  return (
    <div className={styles.container}>
      <div className={styles.qrWrapper}>
        {loading && !error && <div className={styles.loading}>Đang tạo mã QR...</div>}
        {error && (
          <div className={styles.errorBox}>
            ⚠️ Không thể tải mã QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={qrUrl} 
          alt="VietQR payment code" 
          className={`${styles.image} ${loading ? styles.hidden : ''}`}
          onLoad={() => { setLoading(false); setError(false); }}
          onError={() => { setLoading(false); setError(true); }}
        />
      </div>
      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Ngân hàng:</span>
          <span className={styles.value}>{bankName}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Số tài khoản:</span>
          <span className={styles.value}>{accountNo}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Chủ thẻ:</span>
          <span className={styles.value}>{accountName}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Số tiền:</span>
          <span className={`${styles.value} ${styles.highlight}`}>{amount.toLocaleString('vi-VN')} ₫</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Nội dung CK:</span>
          <span className={styles.value}>{content}</span>
        </div>
      </div>
    </div>
  );
}
