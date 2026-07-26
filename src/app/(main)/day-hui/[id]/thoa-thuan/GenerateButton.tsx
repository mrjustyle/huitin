'use client';

import { useState } from 'react';
import { generateAgreement } from '@/features/agreement/actions';
import Button from '@/components/ui/Button';

export default function GenerateButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    const result = await generateAgreement(groupId);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
      {error && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-error-light)',
          color: '#B91C1C',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          width: '100%',
          textAlign: 'center',
        }}>
          ⚠ {error}
        </div>
      )}
      <Button onClick={handleGenerate} loading={loading} size="lg">
        📋 Tạo thỏa thuận
      </Button>
    </div>
  );
}
