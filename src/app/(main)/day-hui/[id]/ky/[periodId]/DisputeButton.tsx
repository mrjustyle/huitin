'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createDispute } from '@/features/period/actions';
import styles from './DisputeButton.module.css';

export default function DisputeButton({ 
  groupId, 
  periodId 
}: { 
  groupId: string; 
  periodId: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setLoading(true);
    const result = await createDispute(groupId, periodId, reason, evidenceUrl);
    setLoading(false);
    
    if (result.success) {
      addToast({ type: 'success', title: 'Đã gửi khiếu nại', message: 'Admin sẽ kiểm tra và phản hồi sớm nhất.' });
      setIsOpen(false);
    } else {
      addToast({ type: 'error', title: 'Lỗi gửi khiếu nại', message: result.error || 'Vui lòng thử lại.' });
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className={styles.disputeTriggerBtn}
      >
        ⚠️ Báo cáo / Khiếu nại
      </Button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Tạo Khiếu nại / Báo cáo sự cố</h3>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <p className={styles.desc}>
                Nếu có vấn đề với kỳ hụi này (VD: Đóng tiền nhưng không được xác nhận, hoặc chủ hụi trễ hẹn trả tiền), bạn có thể gửi khiếu nại để được hỗ trợ.
              </p>
              
              <div className={styles.formGroup}>
                <label>Lý do khiếu nại (bắt buộc):</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả chi tiết sự cố bạn đang gặp phải..."
                  rows={4}
                  required
                  className={styles.textarea}
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: 16 }}>
                <label>Link hình ảnh/bằng chứng (Tùy chọn):</label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className={styles.textarea}
                  style={{ height: 40 }}
                  disabled={loading}
                />
              </div>
              
              <div className={styles.actions}>
                <Button variant="ghost" type="button" onClick={() => setIsOpen(false)}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit" loading={loading}>
                  Gửi Khiếu Nại
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
