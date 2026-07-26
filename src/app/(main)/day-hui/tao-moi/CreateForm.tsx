'use client';

import { useActionState, useState, useMemo, useEffect } from 'react';
import { createHuiGroup } from '@/features/hui/actions';
import { getBankAccounts } from '@/features/profile/actions';
import { getBankLogoUrl } from '@/features/profile/components/bankData';
import { calculateCashflow, formatVND } from '@/features/hui/cashflow';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './page.module.css';

const STEPS = [
  { id: 'type', label: 'Loại hụi' },
  { id: 'config', label: 'Cấu hình' },
  { id: 'schedule', label: 'Lịch trình' },
  { id: 'rules', label: 'Quy tắc' },
  { id: 'preview', label: 'Xem trước' },
];

type FormValues = {
  name: string;
  huiType: string;
  shareValue: string;
  totalShares: string;
  maxSharesPerMember: string;
  cycleType: string;
  startDate: string;
  paymentDayOfMonth: string;
  gracePeriodDays: string;
  payoutMethod: string;
  commissionType: string;
  commissionAmount: string;
  receivingBankAccountId: string;
  ownerAddress: string;
  ownerParticipates: string;
  ownerShares: string;
  minBid: string;
  maxBid: string;
  fixedInterestAmount: string;
  fixedInterestPercent: string;
  requireKyc: string;
};

export default function CreateHuiForm() {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(createHuiGroup, undefined);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [values, setValues] = useState<FormValues>({
    name: '',
    huiType: 'khong_lai',
    shareValue: '1000000',
    totalShares: '10',
    maxSharesPerMember: '1',
    cycleType: 'monthly',
    startDate: getDefaultStartDate(),
    paymentDayOfMonth: '1',
    gracePeriodDays: '3',
    payoutMethod: 'fixed_order',
    commissionType: 'none',
    commissionAmount: '0',
    receivingBankAccountId: '',
    ownerAddress: '',
    ownerParticipates: 'no',
    ownerShares: '1',
    minBid: '0',
    maxBid: '',
    fixedInterestAmount: '100000',
    fixedInterestPercent: '10',
    requireKyc: 'false',
  });

  const updateValue = (key: keyof FormValues, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'huiType') {
        if (value === 'khong_lai') next.payoutMethod = 'fixed_order';
        if (value === 'boc_tham') next.payoutMethod = 'draw';
        if (value === 'bo_hui') next.payoutMethod = 'auction';
        if (value === 'boc_tham_lai_co_dinh') next.payoutMethod = 'draw';
      }
      return next;
    });
  };

  useEffect(() => {
    async function loadBanks() {
      const banks = await getBankAccounts();
      setBankAccounts(banks);
      const primaryBank = banks.find((b: any) => b.is_primary);
      if (primaryBank) {
        setValues((prev) => ({ ...prev, receivingBankAccountId: primaryBank.id }));
      }
    }
    loadBanks();
  }, []);

  const cashflow = useMemo(() => {
    const sv = parseInt(values.shareValue) || 0;
    const ts = parseInt(values.totalShares) || 0;
    if (sv <= 0 || ts <= 0) return null;

    return calculateCashflow({
      shareValue: sv,
      totalShares: ts,
      cycleType: values.cycleType as 'monthly',
      startDate: values.startDate,
      commissionType: values.commissionType as 'none',
      commissionAmount: parseInt(values.commissionAmount) || 0,
      huiType: values.huiType as 'khong_lai' | 'boc_tham' | 'bo_hui' | 'boc_tham_lai_co_dinh',
      fixedInterestAmount: values.huiType === 'boc_tham_lai_co_dinh' ? (parseInt(values.fixedInterestAmount) || 0) : 0,
    });
  }, [values.shareValue, values.totalShares, values.cycleType, values.startDate, values.commissionType, values.commissionAmount, values.huiType]);

  const canNext = () => {
    switch (step) {
      case 0: return values.name && values.huiType;
      case 1: 
        const validShares = parseInt(values.shareValue) >= 100000 && parseInt(values.totalShares) >= 2;
        const validOwnerShares = values.ownerParticipates === 'yes' ? parseInt(values.ownerShares) <= parseInt(values.totalShares) : true;
        return validShares && validOwnerShares;
      case 2: return values.cycleType && values.startDate;
      case 3: 
        if (values.huiType === 'boc_tham_lai_co_dinh') return !!values.fixedInterestAmount;
        return true;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tạo dây hụi mới</h1>
      </div>

      {/* Step indicator */}
      <div className={styles.stepper}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.step} ${i === step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}
          >
            <div className={styles.stepDot}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={styles.stepLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {state?.error && (
        <div className={styles.alert}>⚠ {state.error}</div>
      )}

      <form 
        action={action} 
        onSubmit={(e) => {
          // Chặn mọi hình thức submit (kể cả double click nút) nếu chưa ở bước cuối
          if (step < STEPS.length - 1) {
            e.preventDefault();
          }
        }}
        onKeyDown={(e) => {
          // Chặn Enter submit khi chưa ở bước cuối
          if (e.key === 'Enter' && step < STEPS.length - 1) {
            e.preventDefault();
          }
        }}
      >
        {/* Hidden fields for all values */}
        {Object.entries(values).map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val} />
        ))}

        <div className={styles.stepContent}>
          {/* Step 0: Type */}
          {step === 0 && (
            <div className={styles.stepPanel}>
              <Input
                label="Tên dây hụi"
                placeholder="VD: Hụi gia đình tháng 7"
                value={values.name}
                onChange={(e) => updateValue('name', e.target.value)}
                required
                icon={<span>📝</span>}
              />

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Loại hụi</label>
                <div className={styles.optionCards}>
                  {[
                    { value: 'khong_lai', label: 'Hụi không lãi', desc: 'Mỗi người đóng/nhận bằng nhau', icon: '🤝' },
                    { value: 'boc_tham', label: 'Hụi bốc thăm', desc: 'Bốc thăm xác định người lĩnh', icon: '🎲' },
                    { value: 'bo_hui', label: 'Hụi bỏ (có lãi)', desc: 'Đấu giá, người bỏ cao nhất lĩnh', icon: '💰' },
                    { value: 'boc_tham_lai_co_dinh', label: 'Hụi bốc thăm (lãi cố định)', desc: 'Lãi cố định, bốc thăm lĩnh', icon: '🎯' },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className={`${styles.optionCard} ${values.huiType === opt.value ? styles.optionActive : ''}`}
                      onClick={() => updateValue('huiType', opt.value)}
                    >
                      <span className={styles.optionIcon}>{opt.icon}</span>
                      <strong>{opt.label}</strong>
                      <span className={styles.optionDesc}>{opt.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Config */}
          {step === 1 && (
            <div className={styles.stepPanel}>
              <Input
                label="Giá trị phần hụi (VND)"
                type="number"
                value={values.shareValue}
                onChange={(e) => updateValue('shareValue', e.target.value)}
                min={100000}
                step={100000}
                required
                hint={`= ${formatVND(parseInt(values.shareValue) || 0)}`}
                icon={<span>💵</span>}
              />

              <Input
                label="Số phần hụi (= số thành viên)"
                type="number"
                value={values.totalShares}
                onChange={(e) => updateValue('totalShares', e.target.value)}
                min={2}
                max={100}
                required
                hint={`Tổng giá trị: ${formatVND((parseInt(values.shareValue) || 0) * (parseInt(values.totalShares) || 0))}`}
                icon={<span>👥</span>}
              />

              <Input
                label="Tối đa phần/thành viên"
                type="number"
                value={values.maxSharesPerMember}
                onChange={(e) => updateValue('maxSharesPerMember', e.target.value)}
                min={1}
                max={5}
                hint="Cho phép 1 người mua nhiều phần"
                icon={<span>📊</span>}
              />

              {cashflow?.legalWarning && (
                <div className={styles.warning}>
                  ⚖️ <strong>Lưu ý pháp lý:</strong> Tổng giá trị dây hụi trên 100 triệu VND 
                  cần thông báo UBND cấp xã theo NĐ 19/2019.
                </div>
              )}
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className={styles.stepPanel}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Chu kỳ đóng hụi</label>
                <div className={styles.optionRow}>
                  {[
                    { value: 'daily', label: 'Hàng ngày' },
                    { value: 'weekly', label: 'Hàng tuần' },
                    { value: 'biweekly', label: '2 tuần' },
                    { value: 'monthly', label: 'Hàng tháng' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.optionBtn} ${values.cycleType === opt.value ? styles.optionBtnActive : ''}`}
                      onClick={() => updateValue('cycleType', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Ngày bắt đầu"
                type="date"
                value={values.startDate}
                onChange={(e) => updateValue('startDate', e.target.value)}
                required
                icon={<span>📅</span>}
              />

              {values.cycleType === 'monthly' && (
                <Input
                  label="Ngày đóng tiền trong tháng"
                  type="number"
                  value={values.paymentDayOfMonth}
                  onChange={(e) => updateValue('paymentDayOfMonth', e.target.value)}
                  min={1}
                  max={28}
                  hint="Chọn từ 1–28 để tránh lệch tháng"
                  icon={<span>📆</span>}
                />
              )}

              <Input
                label="Số ngày gia hạn"
                type="number"
                value={values.gracePeriodDays}
                onChange={(e) => updateValue('gracePeriodDays', e.target.value)}
                min={0}
                max={15}
                hint="Số ngày cho phép đóng trễ trước khi tính phạt"
                icon={<span>⏰</span>}
              />
            </div>
          )}

          {/* Step 3: Rules */}
          {step === 3 && (
            <div className={styles.stepPanel}>
              {values.huiType === 'boc_tham_lai_co_dinh' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Lãi cố định (VND)"
                    type="number"
                    value={values.fixedInterestAmount}
                    onChange={(e) => {
                      updateValue('fixedInterestAmount', e.target.value);
                      const amt = parseInt(e.target.value) || 0;
                      const sv = parseInt(values.shareValue) || 1;
                      const pct = ((amt / sv) * 100).toFixed(2);
                      updateValue('fixedInterestPercent', pct.endsWith('.00') ? pct.slice(0, -3) : pct);
                    }}
                    min={0}
                    step={10000}
                    required
                    hint={`Hụi sống sẽ đóng: ${formatVND((parseInt(values.shareValue) || 0) - (parseInt(values.fixedInterestAmount) || 0))}`}
                    icon={<span>💵</span>}
                  />
                  <Input
                    label="Tương đương (%)"
                    type="number"
                    value={values.fixedInterestPercent}
                    onChange={(e) => {
                      updateValue('fixedInterestPercent', e.target.value);
                      const pct = parseFloat(e.target.value) || 0;
                      const sv = parseInt(values.shareValue) || 0;
                      const amt = Math.round((pct / 100) * sv);
                      updateValue('fixedInterestAmount', amt.toString());
                    }}
                    min={0}
                    max={100}
                    step={0.1}
                    hint="% trên Giá trị phần hụi"
                    icon={<span>%</span>}
                  />
                </div>
              )}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Hoa hồng chủ hụi</label>
                <div className={styles.optionRow}>
                  {[
                    { value: 'none', label: 'Không thu' },
                    { value: 'fixed_per_period', label: 'Cố định/kỳ' },
                    { value: 'percentage', label: '% giá trị' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.optionBtn} ${values.commissionType === opt.value ? styles.optionBtnActive : ''}`}
                      onClick={() => updateValue('commissionType', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {values.commissionType !== 'none' && (
                <Input
                  label={values.commissionType === 'percentage' ? 'Phần trăm (%)' : 'Số tiền hoa hồng (VND)'}
                  type="number"
                  value={values.commissionAmount}
                  onChange={(e) => updateValue('commissionAmount', e.target.value)}
                  min={0}
                  icon={<span>💰</span>}
                />
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Chủ hụi có tham gia đóng hụi?</label>
                <div className={styles.optionRow}>
                  {[
                    { value: 'no', label: 'Không (chỉ ăn hoa hồng)' },
                    { value: 'yes', label: 'Có (đóng như thành viên)' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.optionBtn} ${values.ownerParticipates === opt.value ? styles.optionBtnActive : ''}`}
                      onClick={() => updateValue('ownerParticipates', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {values.ownerParticipates === 'yes' && (
                <Input
                  label="Số phần của chủ hụi"
                  type="number"
                  value={values.ownerShares}
                  onChange={(e) => updateValue('ownerShares', e.target.value)}
                  min={1}
                  max={parseInt(values.maxSharesPerMember) || 5}
                  hint="Số phần chủ hụi tham gia (giống member)"
                  icon={<span>👑</span>}
                />
              )}

              {values.huiType === 'bo_hui' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Giá bỏ tối thiểu (VND)"
                    type="number"
                    name="minBid"
                    value={values.minBid}
                    onChange={(e) => updateValue('minBid', e.target.value)}
                    min={0}
                    hint="Ví dụ: 0đ hoặc 10.000đ"
                    icon={<span>📉</span>}
                  />
                  <Input
                    label="Giá bỏ tối đa (VND)"
                    type="number"
                    name="maxBid"
                    value={values.maxBid}
                    onChange={(e) => updateValue('maxBid', e.target.value)}
                    min={0}
                    hint="Bỏ trống nếu không giới hạn"
                    icon={<span>📈</span>}
                  />
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={values.requireKyc === 'true'}
                    onChange={(e) => updateValue('requireKyc', e.target.checked ? 'true' : 'false')}
                    style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                  />
                  Bắt buộc Hụi viên xác thực danh tính (KYC) mới được tham gia
                </label>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tài khoản ngân hàng nhận tiền</label>
                {bankAccounts.length === 0 ? (
                  <div className={styles.warning}>
                    Bạn chưa thêm tài khoản ngân hàng nào. Bạn có thể thêm sau trong trang Cá nhân.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input type="hidden" name="receivingBankAccountId" value={values.receivingBankAccountId} />
                    {bankAccounts.map(bank => (
                      <label
                        key={bank.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer',
                          border: values.receivingBankAccountId === bank.id ? '2px solid var(--color-primary-500)' : '1px solid var(--border-color)',
                          background: values.receivingBankAccountId === bank.id ? 'var(--color-primary-50)' : 'var(--bg-secondary)',
                          transition: 'all 0.2s ease',
                          boxShadow: values.receivingBankAccountId === bank.id ? 'var(--shadow-sm)' : 'none',
                        }}
                        onClick={() => updateValue('receivingBankAccountId', bank.id)}
                      >
                        <input
                          type="radio"
                          name="_bank_radio"
                          value={bank.id}
                          checked={values.receivingBankAccountId === bank.id}
                          onChange={() => updateValue('receivingBankAccountId', bank.id)}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden',
                          background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Image
                            src={getBankLogoUrl(bank.bank_bin)}
                            alt={bank.bank_name}
                            width={32}
                            height={32}
                            style={{ objectFit: 'contain', borderRadius: '6px' }}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.textContent = bank.bank_name.charAt(0);
                                parent.style.fontSize = '16px';
                                parent.style.fontWeight = 'bold';
                                parent.style.color = 'var(--color-primary-600)';
                                parent.style.background = 'var(--color-primary-50)';
                              }
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            {bank.bank_name}
                            {bank.is_primary && (
                              <span style={{
                                marginLeft: '8px', fontSize: '10px', padding: '2px 6px',
                                background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                                borderRadius: '4px', border: '1px solid var(--color-primary-200)',
                                fontWeight: 500
                              }}>Mặc định</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            <span style={{ fontFamily: 'var(--font-money)', letterSpacing: '0.05em' }}>•••• {bank.account_number_last4}</span> · {bank.account_name}
                          </div>
                        </div>
                        {values.receivingBankAccountId === bank.id && (
                          <div style={{ color: 'var(--color-primary-500)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && cashflow && (
            <div className={styles.stepPanel}>
              <div className={styles.previewSummary}>
                <div className={styles.previewItem}>
                  <span>Tên</span>
                  <strong>{values.name}</strong>
                </div>
                <div className={styles.previewItem}>
                  <span>Loại</span>
                  <strong>
                    {values.huiType === 'khong_lai' ? 'Không lãi' :
                     values.huiType === 'boc_tham' ? 'Bốc thăm' : 
                     values.huiType === 'boc_tham_lai_co_dinh' ? 'Bốc thăm (lãi cố định)' : 'Bỏ hụi'}
                  </strong>
                </div>
                <div className={styles.previewItem}>
                  <span>Phần hụi</span>
                  <strong>{formatVND(parseInt(values.shareValue))}</strong>
                </div>
                <div className={styles.previewItem}>
                  <span>Số thành viên</span>
                  <strong>{values.totalShares}</strong>
                </div>
                <div className={styles.previewItem}>
                  <span>Tổng giá trị</span>
                  <strong className={styles.previewHighlight}>
                    {formatVND(cashflow.totalGroupValue)}
                  </strong>
                </div>
                <div className={styles.previewItem}>
                  <span>Kỳ hạn</span>
                  <strong>{cashflow.totalPeriods} kỳ</strong>
                </div>
              </div>

              {cashflow.legalWarning && (
                <div className={styles.warning}>
                  ⚖️ Dây hụi có giá trị trên 100 triệu VND — cần thông báo UBND cấp xã.
                </div>
              )}

              {/* Cashflow Table */}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Kỳ</th>
                      <th>Ngày đóng</th>
                      <th>Đóng/người</th>
                      <th>Người lĩnh nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashflow.rows.slice(0, 12).map((row) => (
                      <tr key={row.periodNumber}>
                        <td>{row.periodNumber}</td>
                        <td>{new Date(row.dueDate).toLocaleDateString('vi-VN')}</td>
                        <td>
                          {typeof row.memberPays === 'string' 
                            ? row.memberPays.split('\n').map((line, i) => <div key={i}>{line}</div>)
                            : formatVND(row.memberPays)
                          }
                        </td>
                        <td>{typeof row.recipientReceives === 'string' ? row.recipientReceives : formatVND(row.recipientReceives)}</td>
                      </tr>
                    ))}
                    {cashflow.rows.length > 12 && (
                      <tr>
                        <td colSpan={4} className={styles.tableMore}>
                          ... và {cashflow.rows.length - 12} kỳ nữa
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={styles.nav}>
          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
            >
              ← Quay lại
            </Button>
          )}
          <div className={styles.navRight}>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
              >
                Tiếp theo →
              </Button>
            ) : (
              <Button key="submit-btn" type="submit" loading={pending} size="lg">
                🎉 Tạo dây hụi
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function getDefaultStartDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}
