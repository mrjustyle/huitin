'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { HUI_STATUS_LABELS, HUI_TYPE_LABELS, CYCLE_LABELS, formatVND } from '@/lib/constants';
import { IconOwner, IconAccount, IconFilter } from '@/components/ui/Icons';
import styles from './page.module.css';

export default function GroupListClient({ groups }: { groups: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredGroups = groups.filter((g) => {
    const matchName = g.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchType = typeFilter === 'all' || g.hui_type === typeFilter;
    return matchName && matchStatus && matchType;
  });

  return (
    <>
      <div className={styles.filters}>
        <input 
          type="text" 
          placeholder="Tìm tên dây hụi..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.statusSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="recruiting">Đang gom người</option>
          <option value="active">Đang hoạt động</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className={styles.statusSelect}
        >
          <option value="all">Tất cả loại hụi</option>
          <option value="khong_lai">Hụi không lãi</option>
          <option value="bo_hui">Hụi thảo (kêu)</option>
          <option value="boc_tham">Hụi bốc thăm</option>
        </select>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="emptyState" style={{ marginTop: '2rem' }}>
          <div className="emptyIcon" style={{ color: 'var(--text-muted)' }}>
            <IconFilter size={48} />
          </div>
          <h3 className="emptyTitle">Không tìm thấy dây hụi</h3>
          <p className="emptyDesc">Chưa có dây hụi nào phù hợp với điều kiện tìm kiếm của bạn.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredGroups.map((g) => (
            <Link key={g.id} href={`/day-hui/${g.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardName}>
                  <span className={styles.nameText}>{g.name}</span>
                  {g.require_kyc && (
                    <span title="Dây hụi yêu cầu xác minh danh tính" className={styles.kycStamp}>
                      ✓ KYC
                    </span>
                  )}
                </h3>
                <StatusBadge status={g.status} currentMembers={g.current_members} totalShares={g.total_shares} />
              </div>
              <div className={styles.cardMeta}>
                <span>{HUI_TYPE_LABELS[g.hui_type] || g.hui_type}</span>
                <span>·</span>
                <span>{CYCLE_LABELS[g.cycle_type] || g.cycle_type}</span>
              </div>
              <div className={styles.cardStats}>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatValue}>{formatVND(g.share_value)}</span>
                  <span className={styles.cardStatLabel}>Phần hụi</span>
                </div>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatValue}>{g.current_members}/{g.total_shares}</span>
                  <span className={styles.cardStatLabel}>Thành viên</span>
                </div>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatValue}>
                    {formatVND(g.share_value * g.total_shares)}
                  </span>
                  <span className={styles.cardStatLabel}>Tổng giá trị</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <Badge variant={g.my_role === 'owner' ? 'primary' : 'default'} size="sm">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {g.my_role === 'owner' ? <><IconOwner size={14} /> Chủ hụi</> : <><IconAccount size={14} /> Thành viên</>}
                  </span>
                </Badge>
                <span className={styles.cardDate}>
                  Bắt đầu: {new Date(g.start_date).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status, currentMembers, totalShares }: { status: string, currentMembers?: number, totalShares?: number }) {
  const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    draft: 'default',
    recruiting: 'info',
    pending_agreement: 'warning',
    ready: 'primary',
    active: 'success',
    suspended: 'warning',
    in_dispute: 'error',
    completed: 'success',
    cancelled: 'default',
  };
  
  let isFull = false;
  if (status === 'recruiting' && currentMembers !== undefined && totalShares !== undefined && currentMembers >= totalShares) {
    isFull = true;
  }

  return (
    <Badge variant={isFull ? 'primary' : (variantMap[status] || 'default')} dot size="sm">
      {isFull ? 'Chờ tạo thỏa thuận' : (HUI_STATUS_LABELS[status] || status)}
    </Badge>
  );
}
