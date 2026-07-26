'use client';

import { useState } from 'react';
import { adminResolveDispute } from '@/features/admin/actions';
import { useRouter } from 'next/navigation';
import styles from '@/app/admin/layout.module.css';

export default function AdminResolveDispute({ disputeId, periodId }: { disputeId: string; periodId: string }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) { alert('Vui lòng nhập ghi chú giải quyết.'); return; }
    setLoading(true);
    const result = await adminResolveDispute(disputeId, periodId, note);
    setLoading(false);
    if (result.success) {
      alert('Đã giải quyết khiếu nại!');
      router.refresh();
    } else {
      alert('Lỗi: ' + result.error);
    }
  };

  return (
    <form onSubmit={handleResolve} className={styles.resolveForm}>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Ghi chú giải quyết của Admin (ví dụ: Đã liên hệ hai bên, đồng ý hoàn tiền)..."
        rows={3}
        required
        className={styles.resolveTextarea}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '10px 20px', background: 'var(--primary)', color: 'white',
          border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.875rem', alignSelf: 'flex-start'
        }}
      >
        {loading ? 'Đang xử lý...' : '✅ Đánh dấu Đã giải quyết'}
      </button>
    </form>
  );
}
