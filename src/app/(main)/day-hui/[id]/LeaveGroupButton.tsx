'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { leaveGroup } from '@/features/hui/actions';

export default function LeaveGroupButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLeave() {
    if (!confirm('Bạn có chắc muốn rời khỏi dây hụi này? Hành động này không thể hoàn tác.')) return;
    
    setLoading(true);
    const result = await leaveGroup(groupId);
    if (result?.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push('/day-hui');
    }
  }

  return (
    <button
      onClick={handleLeave}
      disabled={loading}
      style={{
        display: 'block', 
        width: '100%', 
        padding: 'var(--space-3) var(--space-4)',
        fontSize: 'var(--font-size-sm)', 
        color: '#DC2626', 
        borderRadius: 'var(--radius-md)',
        textAlign: 'left', 
        opacity: loading ? 0.5 : 1,
        transition: 'all 0.2s',
        marginTop: 'var(--space-2)',
        borderTop: '1px solid var(--color-gray-200)',
        paddingTop: 'calc(var(--space-2) + var(--space-3))'
      }}
      className="actionItem"
    >
      {loading ? '⏳ Đang rời...' : '👋 Rời dây hụi'}
    </button>
  );
}
