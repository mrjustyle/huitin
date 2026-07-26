'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitProof, confirmPayment, initiatePayout, confirmPayout, remindPayment } from '@/features/period/actions';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';

export function RemindPaymentButton({ groupId, periodId, memberId }: { groupId: string, periodId: string, memberId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleRemind = async () => {
    setLoading(true);
    const res = await remindPayment(groupId, periodId, memberId);
    if (res?.error) {
      addToast({ type: 'error', title: 'Lỗi nhắc nhở', message: res.error });
    } else {
      addToast({ type: 'success', title: 'Đã gửi nhắc nhở', message: 'Thành viên sẽ nhận được thông báo.' });
    }
    setLoading(false);
  };

  return (
    <button 
      className={styles.remindBtn} 
      onClick={handleRemind} 
      disabled={loading}
    >
      {loading ? '...' : '🔔 Nhắc'}
    </button>
  );
}

export function SubmitProofButton({ contributionId, periodId, groupId }: { contributionId: string, periodId: string, groupId: string }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let evidenceUrl: string | undefined;

      if (file) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ext = file.name.split('.').pop();
          const filePath = `${user.id}/${contributionId}-${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('payment-evidence')
            .upload(filePath, file);
          if (!uploadErr) {
            evidenceUrl = filePath;
          } else {
            alert('Lỗi tải ảnh: ' + uploadErr.message);
            setLoading(false);
            return;
          }
        }
      }

      const res = await submitProof(contributionId, evidenceUrl);
      if (res.error) {
        addToast({ type: 'error', title: 'Lỗi đóng hụi', message: res.error });
      } else {
        router.refresh();
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Lỗi mạng', message: e.message });
    }
    setLoading(false);
  };

  return (
    <div className={styles.proofSection}>
      <div className={styles.uploadArea}>
        <label className={styles.fileLabel}>
          📷 {file ? 'Đổi ảnh chứng từ' : 'Chọn ảnh chứng từ chuyển khoản'}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </label>
        {preview && (
          <div className={styles.previewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Bằng chứng chuyển khoản" className={styles.previewImg} />
            <button type="button" className={styles.removePreview} onClick={() => { setFile(null); setPreview(null); }}>✕</button>
          </div>
        )}
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          className={styles.button} 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? '⏳ Đang xử lý...' : (file ? '✅ Xác nhận đã chuyển khoản' : '💵 Xác nhận đã đóng tiền mặt')}
        </button>
        <p className={styles.proofHint}>
          {file 
            ? 'Sau khi bấm, chủ hụi sẽ nhận được thông báo và kiểm tra lại để xác nhận.'
            : 'Nếu giao dịch bằng tiền mặt, bạn có thể bấm xác nhận mà không cần tải ảnh lên.'}
        </p>
      </div>
    </div>
  );
}

export function ConfirmPaymentButton({ contributionId, periodId, groupId }: { contributionId: string, periodId: string, groupId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await confirmPayment(contributionId);
      if (res && res.error) {
        addToast({ type: 'error', title: 'Lỗi xác nhận', message: res.error });
      } else {
        router.refresh();
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Lỗi mạng', message: e.message });
    }
    setLoading(false);
  };

  return (
    <button 
      className={styles.actionBtn} 
      onClick={handleConfirm} 
      disabled={loading}
    >
      {loading ? '...' : '✓ Xác nhận'}
    </button>
  );
}

// Chủ hụi xác nhận đã chuyển tiền cho người lĩnh
export function InitiatePayoutButton({ periodId, recipientName }: { periodId: string, recipientName: string }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let evidenceUrl: string | undefined;

      // Upload evidence image if provided
      if (file) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ext = file.name.split('.').pop();
          const filePath = `${user.id}/payout-${periodId}-${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('payment-evidence')
            .upload(filePath, file);
          if (!uploadErr) {
            evidenceUrl = filePath;
          }
        }
      }

      await initiatePayout(periodId, evidenceUrl);
      router.refresh();
    } catch {
      // ignore
    }
    setLoading(false);
  };

  return (
    <div className={styles.proofSection}>
      <div className={styles.uploadArea}>
        <label className={styles.fileLabel}>
          📷 {file ? 'Đổi ảnh chứng từ' : 'Chọn ảnh chứng từ giải ngân'}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </label>
        {preview && (
          <div className={styles.previewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Bằng chứng giải ngân" className={styles.previewImg} />
            <button type="button" className={styles.removePreview} onClick={() => { setFile(null); setPreview(null); }}>✕</button>
          </div>
        )}
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          className={styles.payoutBtn} 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? '⏳ Đang xử lý...' : (file ? `💸 Xác nhận đã chuyển khoản` : `💵 Xác nhận giao tiền mặt`)}
        </button>
        <p className={styles.proofHint}>
          {file 
            ? `Sau khi bấm, ${recipientName} sẽ nhận được thông báo để kiểm tra.`
            : `Nếu giao dịch bằng tiền mặt, bạn có thể bấm xác nhận mà không cần tải ảnh lên.`}
        </p>
      </div>
    </div>
  );
}

// Người lĩnh xác nhận đã nhận tiền
export function ConfirmPayoutButton({ periodId }: { periodId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleClick = async () => {
    if (!confirm('Xác nhận bạn đã nhận được tiền từ chủ hụi?')) return;
    setLoading(true);
    const res = await confirmPayout(periodId);
    if (res?.error) {
      addToast({ type: 'error', title: 'Lỗi', message: res.error });
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button className={styles.payoutBtn} onClick={handleClick} disabled={loading}>
      {loading ? '⏳ Đang xử lý...' : '✅ Xác nhận đã nhận tiền'}
    </button>
  );
}
