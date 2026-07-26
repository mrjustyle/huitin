'use client';

import { useState } from 'react';
import { cancelGroup, deleteGroup } from '@/features/hui/actions';
import { useToast } from '@/components/ui/Toast';

export default function GroupActions({ groupId, status }: { groupId: string; status: string }) {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const { addToast } = useToast();

  async function handleCancel() {
    if (!confirm('Bạn có chắc muốn hủy dây hụi này? Tất cả thành viên sẽ được thông báo.')) return;
    setLoading('cancel');
    setError('');
    const result = await cancelGroup(groupId);
    if (result?.error) {
      setError(result.error);
      addToast({ type: 'error', title: 'Lỗi hủy dây hụi', message: result.error });
    } else {
      addToast({ type: 'success', title: 'Đã hủy dây hụi', message: 'Tất cả thành viên đã được thông báo.' });
    }
    setLoading('');
  }

  async function handleDelete() {
    if (!confirm('XÓA VĨNH VIỄN dây hụi này? Hành động không thể hoàn tác!')) return;
    setLoading('delete');
    setError('');
    const result = await deleteGroup(groupId);
    if (result?.error) {
      setError(result.error);
      setLoading('');
    }
    // If success, redirect happens server-side
  }

  const canCancel = ['recruiting', 'pending_agreement'].includes(status);
  const canDelete = ['draft', 'recruiting', 'completed'].includes(status);

  if (!canCancel && !canDelete) return null;

  return (
    <>
      {error && (
        <div style={{
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--color-error-light)',
          color: '#B91C1C',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-xs)',
        }}>
          {error}
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--color-gray-200)', marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
        {canCancel && status !== 'cancelled' && (
          <button
            onClick={handleCancel}
            disabled={loading === 'cancel'}
            style={{
              display: 'block', width: '100%', padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--font-size-sm)', color: '#DC2626', borderRadius: 'var(--radius-md)',
              textAlign: 'left', opacity: loading === 'cancel' ? 0.5 : 1,
            }}
          >
            {loading === 'cancel' ? '⏳ Đang hủy...' : '❌ Hủy dây hụi'}
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={loading === 'delete'}
            style={{
              display: 'block', width: '100%', padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--font-size-sm)', color: '#B91C1C', borderRadius: 'var(--radius-md)',
              textAlign: 'left', opacity: loading === 'delete' ? 0.5 : 1,
            }}
          >
            {loading === 'delete' ? '⏳ Đang xóa...' : '🗑 Xóa vĩnh viễn'}
          </button>
        )}
      </div>
    </>
  );
}
