'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinGroupByInvite } from '@/features/hui/actions';
import Button from '@/components/ui/Button';

export default function JoinButton({ inviteCode }: { inviteCode: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    setLoading(true);
    setError('');

    const result = await joinGroupByInvite(inviteCode);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/day-hui/${result.groupId}`);
      }, 1500);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
          ✅ Đã gửi yêu cầu tham gia!
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
          Đang chuyển hướng...
        </p>
      </div>
    );
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
      <Button onClick={handleJoin} loading={loading} fullWidth size="lg">
        Tham gia dây hụi
      </Button>
    </div>
  );
}
