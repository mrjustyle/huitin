'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { updateGroupBankAccount } from '@/features/hui/actions';
import { getBankAccounts } from '@/features/profile/actions';
import { getBankLogoUrl } from '@/features/profile/components/bankData';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import styles from './page.module.css';

interface BankAccountSelectorProps {
  groupId: string;
  currentBankAccountId: string | null;
}

export default function BankAccountSelector({ groupId, currentBankAccountId }: BankAccountSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState(currentBankAccountId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showModal) {
      getBankAccounts().then(banks => {
        setBankAccounts(banks);
      });
    }
  }, [showModal]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    const result = await updateGroupBankAccount(groupId, selected || null);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowModal(false);
    }
    setLoading(false);
  };

  const currentBank = bankAccounts.find(b => b.id === currentBankAccountId);

  return (
    <>
      <button 
        type="button"
        className={styles.actionItem}
        onClick={() => setShowModal(true)}
      >
        <span className={styles.actionIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 15h0M2 9.5h20" />
          </svg>
        </span>
        <span>{currentBankAccountId ? 'Đổi TK nhận tiền' : 'Chọn TK nhận tiền'}</span>
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tài khoản ngân hàng nhận tiền"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              ⚠ {error}
            </div>
          )}

          {bankAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              <p>Bạn chưa có tài khoản ngân hàng nào.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Vào <strong>Tài khoản</strong> → <strong>Tài khoản ngân hàng</strong> để thêm.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bankAccounts.map(bank => (
                  <label
                    key={bank.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                      border: selected === bank.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selected === bank.id ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="bankAccount"
                      value={bank.id}
                      checked={selected === bank.id}
                      onChange={() => setSelected(bank.id)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden',
                        background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Image
                          src={getBankLogoUrl(bank.bank_bin)}
                          alt={bank.bank_name}
                          width={28}
                          height={28}
                          style={{ objectFit: 'contain', borderRadius: '6px' }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.textContent = bank.bank_name.charAt(0);
                              parent.style.fontSize = '14px';
                              parent.style.fontWeight = 'bold';
                              parent.style.color = 'var(--color-primary-600)';
                              parent.style.background = 'var(--color-primary-50)';
                            }
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {bank.bank_name}
                          {bank.is_primary && (
                            <span style={{
                              marginLeft: '8px', fontSize: '10px', padding: '2px 6px',
                              background: 'var(--color-primary-50)', color: 'var(--color-primary-700)',
                              borderRadius: '4px', border: '1px solid var(--color-primary-200)'
                            }}>Mặc định</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          •••• {bank.account_number_last4} · {bank.account_name}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button onClick={handleSave} loading={loading}>Lưu thay đổi</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
