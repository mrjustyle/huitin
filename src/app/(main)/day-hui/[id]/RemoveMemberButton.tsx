'use client';

import { useState } from 'react';
import { removeMember } from '@/features/hui/actions';

export default function RemoveMemberButton({ memberId, memberName, groupId }: { 
  memberId: string; 
  memberName: string;
  groupId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Xóa "${memberName}" khỏi dây hụi?`)) return;
    setLoading(true);
    await removeMember(memberId, groupId);
    setLoading(false);
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Xóa thành viên"
      style={{
        padding: '4px 8px',
        fontSize: '12px',
        color: '#EF4444',
        borderRadius: '6px',
        opacity: loading ? 0.5 : 0.7,
        transition: 'all 0.2s',
        cursor: loading ? 'wait' : 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
    >
      {loading ? '...' : '✕'}
    </button>
  );
}
