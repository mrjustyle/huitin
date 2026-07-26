'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';
import { addBankAccount, deleteBankAccount, setPrimaryBank } from '@/features/profile/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import BankSearchSelect from '@/components/ui/BankSearchSelect';
import styles from './BankAccountList.module.css';
import { BANK_LIST, getBankLogoUrl } from './bankData';

interface BankAccount {
  id: string;
  bank_bin: string;
  bank_name: string;
  account_number_last4: string;
  account_name: string;
  is_primary: boolean;
  is_verified: boolean;
}

export default function BankAccountList({ accounts }: { accounts: BankAccount[] }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [state, action, pending] = useActionState(addBankAccount, undefined);
  const [selectedBin, setSelectedBin] = useState('');
  const [selectedName, setSelectedName] = useState('');

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Tài khoản ngân hàng</h3>
        <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
          + Thêm TK
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
          </div>
          <p>Chưa có tài khoản ngân hàng nào</p>
          <p className={styles.emptyHint}>Thêm tài khoản để nhận và gửi tiền hụi</p>
        </div>
      ) : (
        <div className={styles.list}>
          {accounts.map((acc) => (
            <div key={acc.id} className={styles.bankCard}>
              <div className={styles.bankInfo}>
                <div className={styles.bankLogo}>
                  <Image
                    src={getBankLogoUrl(acc.bank_bin)}
                    alt={acc.bank_name}
                    width={36}
                    height={36}
                    className={styles.bankLogoImg}
                    onError={(e) => {
                      // Fallback to first letter if image fails
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.classList.add(styles.bankLogoFallback);
                        parent.textContent = acc.bank_name.charAt(0);
                      }
                    }}
                  />
                </div>
                <div className={styles.bankDetails}>
                  <div className={styles.bankName}>
                    <span>{acc.bank_name}</span>
                    {acc.is_primary && (
                      <Badge variant="primary" size="sm">Mặc định</Badge>
                    )}
                  </div>
                  <div className={styles.accountNum}>
                    •••• {acc.account_number_last4}
                  </div>
                  <div className={styles.accountName}>{acc.account_name}</div>
                </div>
              </div>
              <div className={styles.bankActions}>
                {!acc.is_primary && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => setPrimaryBank(acc.id)}
                    title="Đặt làm mặc định"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  </button>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => {
                    if (confirm('Xóa tài khoản ngân hàng này?')) {
                      deleteBankAccount(acc.id);
                    }
                  }}
                  title="Xóa"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Bank Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedBin(''); setSelectedName(''); }}
        title="Thêm tài khoản ngân hàng"
        size="sm"
      >
        <form action={action} className={styles.addForm}>
          {state?.error && (
            <div className={styles.alert}>⚠ {state.error}</div>
          )}

          <div className={styles.selectWrapper}>
            <label className={styles.selectLabel}>Ngân hàng</label>
            <BankSearchSelect
              banks={BANK_LIST}
              value={selectedBin}
              onChange={(bin, shortName) => {
                setSelectedBin(bin);
                setSelectedName(shortName);
              }}
            />
            {/* Hidden fields for form submission */}
            <input type="hidden" name="bankBin" value={selectedBin} />
            <input type="hidden" name="bankName" value={selectedName} />
          </div>

          <Input
            name="accountNumber"
            label="Số tài khoản"
            placeholder="Nhập số tài khoản"
            required
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <path d="M1 10h22" />
              </svg>
            }
          />

          <Input
            name="accountName"
            label="Tên chủ tài khoản"
            placeholder="VD: NGUYEN VAN A"
            required
            hint="Viết IN HOA, không dấu, đúng như trên TK ngân hàng"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />

          <div className={styles.addFormActions}>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setSelectedBin(''); setSelectedName(''); }} type="button">
              Hủy
            </Button>
            <Button type="submit" loading={pending}>
              Thêm tài khoản
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
