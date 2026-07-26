'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { resolveDispute } from '@/features/period/actions';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function ResolveDisputeClient({ disputeId, periodId }: { disputeId: string, periodId: string }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      alert('Vui lòng nhập ghi chú giải quyết.');
      return;
    }
    
    setLoading(true);
    const result = await resolveDispute(disputeId, periodId, note);
    setLoading(false);
    
    if (result.success) {
      alert('Đã giải quyết khiếu nại thành công!');
      router.refresh();
    } else {
      alert('Lỗi: ' + result.error);
    }
  };

  return (
    <form onSubmit={handleResolve} className={styles.resolveForm}>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nhập ghi chú giải quyết cho khiếu nại này (ví dụ: Đã hoàn tiền cho thành viên)..."
        rows={3}
        required
        className={styles.textarea}
        disabled={loading}
      />
      <Button variant="primary" type="submit" loading={loading} style={{ width: '100%' }}>
        Đánh dấu Đã giải quyết
      </Button>
    </form>
  );
}
