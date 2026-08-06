import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatVND, HUI_STATUS_LABELS, CYCLE_LABELS } from '@/lib/constants';
import CountUpMoney from '@/components/ui/CountUpMoney';
import Badge from '@/components/ui/Badge';
import { IconLedger, IconOwner, IconPayment, IconAccount, IconPayout, IconCycle } from '@/components/ui/Icons';
import { getDashboardStats } from '@/features/dashboard/actions';
import { KPICards, CashflowChart, GroupBreakdownChart } from './DashboardCharts';
import { OnboardingTrigger } from '@/components/onboarding/OnboardingProvider';
import styles from './page.module.css';

export const metadata = {
  title: 'Trang chủ',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Layout will handle the redirect
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'bạn';

  // Fetch user's groups
  const { data: memberships } = await supabase
    .from('hui_members')
    .select('id, group_id, role, shares, status')
    .eq('user_id', user.id)
    .not('status', 'in', '(removed,withdrawn)');

  const groupIds = (memberships || []).map((m) => m.group_id);

  let groups: any[] = [];
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('hui_groups')
      .select('id, name, hui_type, share_value, total_shares, cycle_type, start_date, status, created_at, require_kyc, hui_periods(period_number, status)')
      .in('id', groupIds)
      .order('created_at', { ascending: false });
    groups = data || [];
  }

  // Lấy danh sách nợ (Cần đóng)
  const memberIds = (memberships || []).map(m => m.id);
  
  let pendingContributions: any[] = [];
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('contributions')
      .select('id, amount_due, period_id, hui_periods!inner(id, period_number, payment_due_date, group_id, hui_groups!inner(name))')
      .in('member_id', memberIds)
      .eq('status', 'pending');
    pendingContributions = data || [];
  }

  // Lấy danh sách giải ngân đang chờ nhận
  let pendingPayouts: any[] = [];
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('hui_periods')
      .select('id, period_number, payout_amount, commission_amount, group_id, hui_groups!inner(name)')
      .in('payout_member_id', memberIds)
      .in('status', ['payment_open', 'payout_pending']);
    pendingPayouts = data || [];
  }

  // Build stats
  const activeGroups = groups.filter(g => g.status === 'active');
  const ownerGroups = groups.filter(g => {
    const m = memberships?.find(mm => mm.group_id === g.id);
    return m?.role === 'owner';
  });

  const totalValue = activeGroups.reduce((s, g) => s + (g.share_value || 0), 0);
  const hasGroups = groups.length > 0;

  // KYC status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('kyc_status')
    .eq('id', user!.id)
    .single();

  const kycDone = profile?.kyc_status === 'approved';

  // Fetch dashboard stats for charts
  const dashboardStats = await getDashboardStats(user.id);

  return (
    <div className={styles.dashboard}>
      {/* Welcome Header */}
      <div className={styles.header} data-tour="welcome">
        <OnboardingTrigger tourId="first-visit" />
        <div>
          <h1 className={styles.greeting}>
            Xin chào, {displayName}! 👋
          </h1>
          <p className={styles.subtitle}>
            {hasGroups
              ? `Bạn đang tham gia ${groups.length} dây hụi`
              : 'Chào mừng đến với Hụi Tín. Bắt đầu bằng việc xác minh danh tính.'}
          </p>
        </div>
      </div>

      {/* Stats Cards — only show if has groups */}
      {hasGroups && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconLedger size={24} /></span>
            <div>
              <p className={styles.statValue}>{groups.length}</p>
              <p className={styles.statLabel}>Dây hụi</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconOwner size={24} /></span>
            <div>
              <p className={styles.statValue}>{ownerGroups.length}</p>
              <p className={styles.statLabel}>Làm chủ</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPayment size={24} /></span>
            <div>
              <p className={`${styles.statValue} money`}>{activeGroups.length > 0 ? <CountUpMoney value={totalValue} /> : '—'}</p>
              <p className={styles.statLabel}>Tổng giá trị dây hụi đang chạy</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards with financial summary */}
      {hasGroups && (
        <KPICards stats={dashboardStats} />
      )}

      {/* KYC Alert */}
      {!kycDone && (
        <Link href="/kyc" className={styles.alertCard}>
          <div className={styles.alertIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconAccount size={32} /></div>
          <div className={styles.alertContent}>
            <h3 className={styles.alertTitle}>Xác minh danh tính</h3>
            <p className={styles.alertDesc}>Hoàn tất KYC để có thể tạo và tham gia dây hụi</p>
          </div>
          <span className={styles.alertArrow}>→</span>
        </Link>
      )}

      {/* Action Center: Cần đóng tiền & Chờ nhận tiền */}
      {(pendingContributions.length > 0 || pendingPayouts.length > 0) && (
        <div className={styles.actionCenter}>
          <h2 className={styles.sectionTitle}>Việc cần làm</h2>
          <div className={styles.tasksList}>
            {pendingContributions.map((c: any) => (
              <Link key={`contrib-${c.id}`} href={`/day-hui/${c.hui_periods.group_id}/ky/${c.period_id}`} className={styles.taskCard}>
                <div className={styles.taskIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPayment size={24} /></div>
                <div className={styles.taskInfo}>
                  <h3 className={styles.taskTitle}>Nộp tiền hụi kỳ {c.hui_periods.period_number}</h3>
                  <p className={styles.taskDesc}>{c.hui_periods.hui_groups.name} · Hạn: {new Date(c.hui_periods.payment_due_date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className={styles.taskAction}>
                  <span className="money" style={{ color: '#ef4444', fontWeight: 600 }}><CountUpMoney value={c.amount_due} /></span>
                </div>
              </Link>
            ))}

            {pendingPayouts.map((p: any) => (
              <Link key={`payout-${p.id}`} href={`/day-hui/${p.group_id}/ky/${p.id}`} className={styles.taskCard}>
                <div className={styles.taskIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPayout size={24} /></div>
                <div className={styles.taskInfo}>
                  <h3 className={styles.taskTitle}>Chờ nhận giải ngân kỳ {p.period_number}</h3>
                  <p className={styles.taskDesc}>{p.hui_groups.name}</p>
                </div>
                <div className={styles.taskAction}>
                  <span className="money" style={{ color: '#10b981', fontWeight: 600 }}><CountUpMoney value={p.payout_amount - p.commission_amount} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/day-hui/tao-moi" className={styles.actionCard} data-tour="create-hui">
          <div className={`${styles.actionIcon} ${styles.actionIconPrimary}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <div>
            <h3 className={styles.actionTitle}>Tạo dây hụi mới</h3>
            <p className={styles.actionDesc}>Thiết lập và mời thành viên</p>
          </div>
        </Link>

        <Link href="/day-hui" className={styles.actionCard} data-tour="my-hui">
          <div className={`${styles.actionIcon} ${styles.actionIconTeal}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className={styles.actionTitle}>Dây hụi của tôi</h3>
            <p className={styles.actionDesc}>Xem và quản lý các dây hụi</p>
          </div>
        </Link>
      </div>

      {/* VIP Banner */}
      <Link href="/vip" className={styles.vipBanner} data-tour="vip-banner">
        <div className={styles.vipBannerIcon}>💎</div>
        <div className={styles.vipBannerContent}>
          <h3 className={styles.vipBannerTitle}>Nâng cấp VIP</h3>
          <p className={styles.vipBannerDesc}>Chế độ riêng tư, đối soát tự động, không giới hạn dây hụi</p>
        </div>
        <span className={styles.vipBannerArrow}>→</span>
      </Link>

      {/* Charts */}
      {hasGroups && (
        <div className={styles.chartsGrid}>
          <CashflowChart data={dashboardStats.cashflowByMonth} />
          <GroupBreakdownChart data={dashboardStats.groupBreakdown} />
        </div>
      )}

      {/* Active Groups */}
      {hasGroups ? (
        <div className={styles.groupsSection}>
          <h2 className={styles.sectionTitle}>Dây hụi đang tham gia</h2>
          <div className={styles.groupsList}>
            {groups.slice(0, 5).map((g) => {
              const membership = memberships?.find(m => m.group_id === g.id);
              
              const startedPeriods = (g.hui_periods || []).filter(
                (p: any) => p.status !== 'upcoming' && p.status !== 'cancelled'
              ).length;
              const currentPeriodNum = startedPeriods > 0 ? startedPeriods : 0;
              const progressPercent = g.total_shares ? Math.round((currentPeriodNum / g.total_shares) * 100) : 0;

              return (
                <Link key={g.id} href={`/day-hui/${g.id}`} className={styles.groupItem}>
                  <div className={styles.groupInfo}>
                    <h3 className={styles.groupName}>
                      <span className={styles.nameText}>{g.name}</span>
                      {g.require_kyc && (
                        <span title="Dây hụi yêu cầu xác minh danh tính" className={styles.kycStamp}>
                          ✓ KYC
                        </span>
                      )}
                    </h3>
                    <div className={styles.groupMeta}>
                      <Badge
                        variant={g.status === 'active' ? 'success' : g.status === 'recruiting' ? 'info' : 'default'}
                        size="sm"
                        dot
                      >
                        {HUI_STATUS_LABELS[g.status] || g.status}
                      </Badge>
                      <span>·</span>
                      <span>{CYCLE_LABELS[g.cycle_type] || g.cycle_type}</span>
                    </div>
                    {g.status === 'active' && (
                      <div className={styles.groupProgressSegments}>
                        {Array.from({ length: g.total_shares || 1 }).map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`${styles.progressSegment} ${idx < currentPeriodNum ? styles.filled : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.groupValue}>
                    <span className="money"><CountUpMoney value={g.share_value} duration={1} /></span>
                    <span className={styles.groupRole} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {membership?.role === 'owner' ? <IconOwner size={16} /> : <IconAccount size={16} />}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          {groups.length > 5 && (
            <Link href="/day-hui" className={styles.viewAll}>
              Xem tất cả {groups.length} dây hụi →
            </Link>
          )}
        </div>
      ) : (
        <div className="emptyState">
          <div className="emptyIcon" style={{ color: 'var(--primary)', marginBottom: '1rem' }}><IconCycle size={48} /></div>
          <h2 className="emptyTitle">Chưa có dây hụi nào</h2>
          <p className="emptyDesc">
            Tạo dây hụi đầu tiên hoặc chờ lời mời từ chủ hụi.
          </p>
          <Link href="/day-hui/tao-moi" className="emptyBtn">
            Tạo dây hụi
          </Link>
        </div>
      )}
    </div>
  );
}
