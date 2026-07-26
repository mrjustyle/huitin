'use client';

import { useState } from 'react';
import { signAgreement } from '@/features/agreement/actions';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { exportAgreementToPDFPro } from '@/lib/agreement_export';
import { formatVND } from '@/lib/constants';
import styles from './AgreementView.module.css';

interface AgreementViewProps {
  agreement: any;
  signatures: any[];
  members: any[];
  isOwner: boolean;
  groupId: string;
  currentUserId: string;
  isVip?: boolean;
}

export default function AgreementView({
  agreement,
  signatures,
  members,
  isOwner,
  groupId,
  currentUserId,
  isVip,
}: AgreementViewProps) {
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const [signSuccess, setSignSuccess] = useState(false);

  const content = agreement.content;
  const signedUserIds = signatures.map((s: any) => s.user_id);
  const hasSigned = signedUserIds.includes(currentUserId);
  const allSigned = members.every((m: any) => signedUserIds.includes(m.user_id));

  async function handleSign() {
    setSigning(true);
    setSignError('');
    const result = await signAgreement(groupId);
    if (result?.error) {
      setSignError(result.error);
    } else {
      setSignSuccess(true);
    }
    setSigning(false);
  }
  
  async function handleExport() {
    await exportAgreementToPDFPro(agreement, signatures, content.groupName);
  }

  return (
    <div className={styles.agreement}>
      {/* Header */}
      <div className={styles.docHeader}>
        <h2 className={styles.docTitle}>THỎA THUẬN THAM GIA DÂY HỤI</h2>
        <p className={styles.docSub}>{content.groupName}</p>
        <div className={styles.docMeta}>
          <span>Phiên bản: {content.version}</span>
          <span>·</span>
          <span>{new Date(content.generatedAt).toLocaleDateString('vi-VN')}</span>
          <span>·</span>
          <span className={styles.checksum} title={agreement.checksum}>
            #{agreement.checksum?.slice(0, 8)}
          </span>
          {isVip && (
            <>
              <span>·</span>
              <button className={styles.exportBtn} onClick={handleExport}>
                📕 Xuất PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Parties */}
      <div className={styles.section}>
        <h3>Các bên tham gia</h3>
        <div className={styles.partyCard}>
          <div className={styles.partyLabel}>Chủ hụi</div>
          <div className={styles.partyName}>{content.owner.name}</div>
          {content.owner.phone && <div className={styles.partyMeta}>SĐT: {content.owner.phone}</div>}
          {content.owner.address && <div className={styles.partyMeta}>Địa chỉ: {content.owner.address}</div>}
        </div>
        <div className={styles.memberGrid}>
          {content.members.map((m: any, i: number) => {
            const signed = signedUserIds.includes(m.userId);
            return (
              <div key={i} className={styles.memberCard}>
                <div className={styles.memberCardHeader}>
                  <span>{m.name || `Thành viên ${i + 1}`}</span>
                  {signed ? (
                    <Badge variant="success" size="sm">Đã ký ✓</Badge>
                  ) : (
                    <Badge variant="default" size="sm">Chưa ký</Badge>
                  )}
                </div>
                <div className={styles.memberCardMeta}>
                  {m.payoutOrder ? `#${m.payoutOrder}` : '—'} · {m.shares} phần
                  {m.role === 'owner' && ' · 👑 Chủ hụi'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terms Summary */}
      <div className={styles.section}>
        <h3>Tóm tắt</h3>
        <div className={styles.termGrid}>
          <TermRow label="Loại hụi" value={content.terms.huiType} />
          <TermRow label="Phần hụi" value={content.terms.shareValueText} />
          <TermRow label="Số phần" value={`${content.terms.totalShares}`} />
          <TermRow label="Tổng giá trị" value={content.terms.totalValueText} highlight />
          <TermRow label="Chu kỳ" value={content.terms.cycleType} />
          <TermRow label="Phương thức lĩnh" value={content.terms.payoutMethod} />
          <TermRow label="Gia hạn" value={`${content.terms.gracePeriodDays} ngày`} />
        </div>
      </div>

      {/* Articles */}
      <div className={styles.section}>
        <h3>Điều khoản</h3>
        <div className={styles.articles}>
          {content.articles.map((art: any, i: number) => (
            <div key={i} className={styles.article}>
              <h4>{art.title}</h4>
              <p>{art.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Notice */}
      {content.legalNotice && (
        <div className={styles.legalNotice}>
          ⚖️ {content.legalNotice}
        </div>
      )}

      {/* Sign Section */}
      <div className={styles.signSection}>
        <div className={styles.signStatus}>
          <span>Đã ký: {signatures.length}/{members.length}</span>
          {allSigned && <Badge variant="success">Tất cả đã ký ✓</Badge>}
        </div>

        {signSuccess && (
          <div className={styles.signSuccess}>✅ Bạn đã ký thỏa thuận thành công!</div>
        )}

        {signError && (
          <div className={styles.signError}>⚠ {signError}</div>
        )}

        {!hasSigned && !signSuccess && (
          <div className={styles.signAction}>
            <p className={styles.signDisclaimer}>
              Bằng việc nhấn &ldquo;Ký xác nhận&rdquo;, bạn đồng ý với toàn bộ điều khoản trên
              và cam kết thực hiện nghĩa vụ tài chính của mình.
            </p>
            <Button onClick={handleSign} loading={signing} size="lg" fullWidth>
              ✍️ Ký xác nhận thỏa thuận
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TermRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={styles.termRow}>
      <span>{label}</span>
      <strong className={highlight ? styles.termHighlight : ''}>{value}</strong>
    </div>
  );
}
