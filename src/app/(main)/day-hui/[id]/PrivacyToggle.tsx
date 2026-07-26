'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { togglePrivacyMode } from '@/features/subscription/actions';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function PrivacyToggle({ groupId, enabled }: { groupId: string; enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const router = useRouter();
  const { addToast } = useToast();

  const handleToggle = async () => {
    setLoading(true);
    const res = await togglePrivacyMode(groupId, !isEnabled);
    
    if (res.error) {
      if (res.error.includes('VIP')) {
        addToast({ 
          type: 'warning', 
          title: 'Tính năng VIP', 
          message: res.error + ' → Vào /vip để nâng cấp.'
        });
      } else {
        addToast({ type: 'error', title: 'Lỗi', message: res.error });
      }
    } else {
      setIsEnabled(!isEnabled);
      addToast({ 
        type: 'success', 
        title: isEnabled ? 'Đã tắt' : 'Đã bật', 
        message: isEnabled ? 'Chế độ riêng tư đã tắt.' : 'Chế độ riêng tư đã bật. Tên thành viên sẽ được ẩn danh.'
      });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        border: 'none',
        background: isEnabled ? 'var(--color-primary-500)' : 'var(--border-color)',
        position: 'relative',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '2px',
          left: isEnabled ? '24px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}
