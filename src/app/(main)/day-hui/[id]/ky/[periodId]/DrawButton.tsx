'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { conductDraw, prepareDraw } from '@/features/period/actions';
import { useToast } from '@/components/ui/Toast';
import styles from './DrawButton.module.css';

export default function DrawButton({ period, eligibleCount }: { period: any; eligibleCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ winner: string } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [clientSeed, setClientSeed] = useState('');
  const router = useRouter();
  const { addToast } = useToast();

  const handlePrepare = async () => {
    setLoading(true);
    const res = await prepareDraw(period.id);
    if (res.error) {
      addToast({ type: 'error', title: 'Lỗi', message: res.error });
    } else {
      addToast({ type: 'success', title: 'Đã chuẩn bị bốc thăm', message: 'Mã băm kiểm chứng đã được tạo.' });
      router.refresh();
    }
    setLoading(false);
  };

  const handleDraw = async () => {
    if (!confirm(`Bốc thăm ngẫu nhiên trong ${eligibleCount} thành viên?`)) return;
    
    setSpinning(true);
    setLoading(true);

    // Dramatic delay for spinning animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const res = await conductDraw(period.id);
    setSpinning(false);
    
    if (res.error) {
      addToast({ type: 'error', title: 'Lỗi', message: res.error });
      setLoading(false);
      return;
    }

    if (res.winner) {
      setResult({ winner: res.winner });
      // Auto-refresh after showing result
      setTimeout(() => {
        router.refresh();
      }, 3000);
    }
    
    setLoading(false);
  };

  if (result) {
    return (
      <div className={styles.resultCard}>
        <div className={styles.confetti}>🎉</div>
        <h3 className={styles.resultTitle}>Kết quả bốc thăm</h3>
        <div className={styles.winnerName}>{result.winner}</div>
        <p className={styles.resultDesc}>Người lĩnh hụi kỳ này!</p>
      </div>
    );
  }

  if (!period.draw_server_hash) {
    return (
      <div className={styles.drawCard}>
        <div className={styles.drawIcon}>🔒</div>
        <h3 className={styles.drawTitle}>Bốc thăm kiểm chứng</h3>
        <p className={styles.drawDesc} style={{ marginBottom: '1rem' }}>
          {eligibleCount} thành viên đủ điều kiện. Trước khi bốc thăm, hệ thống cần tạo một mã băm bí mật để đảm bảo tính minh bạch.
        </p>
        <button 
          className={styles.drawBtn} 
          onClick={handlePrepare}
          disabled={loading}
          style={{ background: 'var(--color-primary-600)' }}
        >
          {loading ? 'Đang tạo...' : '1. Tạo mã băm kiểm chứng'}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.drawCard}>
      <div className={styles.drawIcon}>
        <span className={spinning ? styles.spin : ''}>🎲</span>
      </div>
      <h3 className={styles.drawTitle}>Bốc thăm kỳ này</h3>
      <p className={styles.drawDesc} style={{ marginBottom: '0.5rem' }}>
        {eligibleCount} thành viên đủ điều kiện lĩnh hụi.
      </p>
      
      <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', wordBreak: 'break-all' }}>
        <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>Mã băm công khai:</strong>
        <code>{period.draw_server_hash}</code>
      </div>

      <button 
        className={styles.drawBtn} 
        onClick={handleDraw}
        disabled={loading}
      >
        {spinning ? '🎰 Đang bốc thăm...' : '2. Bốc thăm ngẫu nhiên'}
      </button>
    </div>
  );
}
