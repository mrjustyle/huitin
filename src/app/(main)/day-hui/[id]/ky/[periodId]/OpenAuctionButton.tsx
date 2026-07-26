'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { openAuction } from '@/features/auction/actions';

export default function OpenAuctionButton({ periodId }: { periodId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleOpen = () => {
    if (!confirm('Mở phiên đấu giá? Thành viên sẽ có 24 giờ để bỏ giá.')) return;
    
    startTransition(async () => {
      const res = await openAuction(periodId);
      if (res.error) alert(res.error);
      else router.refresh();
    });
  };

  return (
    <button
      onClick={handleOpen}
      disabled={isPending}
      style={{
        padding: '0.75rem 2rem',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.95rem',
        fontWeight: 700,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      {isPending ? '⏳ Đang mở...' : '🔔 Mở đấu giá ngay'}
    </button>
  );
}
