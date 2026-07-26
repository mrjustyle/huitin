'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { activateGroup } from '@/features/agreement/actions';
import Button from '@/components/ui/Button';

export default function ActivateButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleActivate() {
    if (!confirm('Kích hoạt dây hụi sẽ tạo tất cả kỳ hụi và bắt đầu thu tiền. Tiếp tục?')) return;

    setLoading(true);
    setError('');
    const result = await activateGroup(groupId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/day-hui/${groupId}`);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {error && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-error-light)',
          color: '#B91C1C',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
        }}>
          ⚠ {error}
        </div>
      )}
      <Button onClick={handleActivate} loading={loading} size="lg" fullWidth>
        🚀 Kích hoạt dây hụi
      </Button>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        Tất cả kỳ hụi sẽ được tạo tự động. Không thể hoàn tác.
      </p>
    </div>
  );
}
