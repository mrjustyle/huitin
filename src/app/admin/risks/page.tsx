'use client';

import { useState, useEffect } from 'react';
import { getRiskSignals, resolveRiskSignal } from '@/features/admin/risk-actions';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PageLoader from '@/components/ui/PageLoader';
import styles from '@/app/admin/layout.module.css';

const SEVERITY_MAP: Record<string, { label: string; variant: 'default' | 'warning' | 'error' | 'info' }> = {
  low: { label: 'Thấp', variant: 'info' },
  medium: { label: 'Trung bình', variant: 'warning' },
  high: { label: 'Cao', variant: 'error' },
  critical: { label: '🔴 Nghiêm trọng', variant: 'error' },
};

export default function AdminRiskPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [showResolved]);

  const fetchData = async () => {
    setLoading(true);
    const data = await getRiskSignals(showResolved);
    setSignals(data);
    setLoading(false);
  };

  const handleResolve = async (id: string) => {
    setProcessingId(id);
    const result = await resolveRiskSignal(id);
    if (result.error) {
      addToast({ type: 'error', title: 'Lỗi', message: result.error });
    } else {
      addToast({ type: 'success', title: 'Đã xử lý', message: 'Tín hiệu rủi ro đã được đánh dấu đã giải quyết.' });
      setSignals(signals.filter(s => s.id !== id));
    }
    setProcessingId(null);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>⚠️ Tín hiệu rủi ro</h1>
        <p className={styles.pageSubtitle}>
          Giám sát các hành vi bất thường và rủi ro trong hệ thống.
        </p>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Button
          size="sm"
          variant={!showResolved ? 'primary' : 'ghost'}
          onClick={() => setShowResolved(false)}
        >
          Chưa xử lý
        </Button>
        <Button
          size="sm"
          variant={showResolved ? 'primary' : 'ghost'}
          onClick={() => setShowResolved(true)}
        >
          Đã xử lý
        </Button>
      </div>

      {loading ? (
        <PageLoader showCards={3} lines={4} showHeader={false} />
      ) : signals.length === 0 ? (
        <div className={styles.empty} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          {showResolved ? '📋 Không có tín hiệu đã xử lý.' : '🎉 Không có tín hiệu rủi ro nào.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {signals.map(s => {
            const sev = SEVERITY_MAP[s.severity] || SEVERITY_MAP.medium;
            return (
              <div key={s.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                borderLeft: `4px solid ${s.severity === 'critical' ? '#ef4444' : s.severity === 'high' ? '#f59e0b' : 'var(--border-color)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {s.signal_type}
                    </span>
                    <Badge variant={sev.variant} size="sm">
                      {sev.label}
                    </Badge>
                  </div>
                  {!s.is_resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(s.id)}
                      loading={processingId === s.id}
                    >
                      ✓ Đã xử lý
                    </Button>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  {s.description || 'Không có mô tả'}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>👤 {s.userName}</span>
                  {s.group_id && <span>📦 {s.groupName}</span>}
                  <span>📅 {new Date(s.created_at).toLocaleString('vi-VN')}</span>
                  {s.resolved_at && <span>✅ Xử lý: {new Date(s.resolved_at).toLocaleString('vi-VN')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
