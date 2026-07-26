import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGroupDetail } from '@/features/hui/actions';
import Badge from '@/components/ui/Badge';
import { HUI_STATUS_LABELS, HUI_TYPE_LABELS, CYCLE_LABELS, PAYOUT_METHOD_LABELS, MEMBER_STATUS_LABELS, formatVND, formatDate, APP_URL } from '@/lib/constants';
import GroupActions from './GroupActions';
import InviteCard from './InviteCard';
import RemoveMemberButton from './RemoveMemberButton';
import LeaveGroupButton from './LeaveGroupButton';
import { CashflowButton } from './CashflowModal';
import BankAccountSelector from './BankAccountSelector';
import PeriodTimeline from './PeriodTimeline';
import PersonalPnL from './PersonalPnL';
import ChatBox from './ChatBox';
import VotingPanel from './VotingPanel';
import UBNDNoticeButton from './UBNDNoticeButton';
import PrivacyToggle from './PrivacyToggle';
import { 
  IconPayment, 
  IconMembers, 
  IconLedger, 
  IconOwner, 
  IconConfirmed, 
  IconAgreement, 
  IconReceipt,
  IconDisputed
} from '@/components/ui/Icons';
import styles from './page.module.css';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Chi tiết dây hụi',
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const data = await getGroupDetail(id);

  if (!data) notFound();

  const { group, members, periods, isOwner, myContributions, myMemberIds } = data;

  // Privacy mode helper
  const privacyMode = group.privacy_mode === true;
  const getDisplayName = (m: any, index: number) => {
    if (!privacyMode || isOwner) return m.user_profiles?.full_name || 'Chưa rõ';
    // Show own name, owner name, anonymize others
    if (myMemberIds.includes(m.id)) return m.user_profiles?.full_name || 'Chưa rõ';
    if (m.role === 'owner') return m.user_profiles?.full_name || 'Chủ hụi';
    return `Thành viên #${index + 1}`;
  };
  const getAvatar = (m: any, index: number) => {
    if (!privacyMode || isOwner) return m.user_profiles?.full_name?.charAt(0)?.toUpperCase() || '?';
    if (myMemberIds.includes(m.id)) return m.user_profiles?.full_name?.charAt(0)?.toUpperCase() || '?';
    if (m.role === 'owner') return m.user_profiles?.full_name?.charAt(0)?.toUpperCase() || '?';
    return '#';
  };

  // Fetch votes for active groups
  let votes: any[] = [];
  if (['active', 'completed', 'pending_agreement'].includes(group.status)) {
    const { getGroupVotes } = await import('@/features/voting/actions');
    votes = await getGroupVotes(id);
  }
  const activeMemberCount = members.filter((m: any) => !['removed', 'withdrawn'].includes(m.status)).length;

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    draft: 'default', recruiting: 'info', pending_agreement: 'warning',
    ready: 'primary', active: 'success', suspended: 'warning',
    in_dispute: 'error', completed: 'success', cancelled: 'default',
  };

  const allSigned = members.every((m: any) => m.agreement_signed_at);
  const totalMemberShares = members.reduce((sum: number, m: any) => sum + m.shares, 0);
  const canActivate = group.status === 'pending_agreement' && allSigned && totalMemberShares >= group.total_shares;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/day-hui" className={styles.backLink}>← Dây hụi</Link>
        <div className={styles.headerMain}>
          <div>
            <h1 className={styles.title}>{group.name}</h1>
            <div className={styles.headerMeta}>
              <Badge variant={
                group.status === 'recruiting' && members.length >= group.total_shares ? 'primary' : 
                canActivate ? 'success' :
                (statusVariant[group.status] || 'default')
              } dot>
                {group.status === 'recruiting' && members.length >= group.total_shares 
                  ? 'Chờ tạo thỏa thuận' 
                  : canActivate 
                    ? 'Chờ kích hoạt'
                    : (HUI_STATUS_LABELS[group.status] || group.status)}
              </Badge>
              <span>{HUI_TYPE_LABELS[group.hui_type]}</span>
              <span>·</span>
              <span>{CYCLE_LABELS[group.cycle_type]}</span>
            </div>
          </div>
        </div>
      </div>

      <PersonalPnL 
        group={group} 
        periods={periods} 
        myMemberIds={myMemberIds} 
        myContributions={myContributions} 
      />

      <div className={styles.grid}>
        {/* Left: Info + Members */}
        <div className={styles.mainCol}>
          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statIcon} style={{ color: 'var(--primary)' }}><IconPayment size={28} /></span>
              <div>
                <div className={styles.statValue}>{formatVND(group.share_value)}</div>
                <div className={styles.statLabel}>Phần hụi</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon} style={{ color: 'var(--text-secondary)' }}><IconMembers size={28} /></span>
              <div>
                <div className={styles.statValue}>
                  {members.filter((m: { status: string }) => !['removed', 'withdrawn'].includes(m.status)).length}/{group.total_shares}
                </div>
                <div className={styles.statLabel}>Thành viên</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon} style={{ color: 'var(--secondary-500)' }}><IconLedger size={28} /></span>
              <div>
                <div className={styles.statValue}>{formatVND(group.share_value * group.total_shares)}</div>
                <div className={styles.statLabel}>Tổng giá trị</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {['active', 'completed'].includes(group.status) && (
            <PeriodTimeline groupId={group.id} periods={periods} huiType={group.hui_type} />
          )}

          {/* Thỏa thuận */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Thành viên</h2>
              {isOwner && group.status === 'recruiting' && (
                <span className={styles.inviteHint}>
                  Mã mời: <code className={styles.inviteCode}>{group.invite_code}</code>
                </span>
              )}
            </div>
            <div className={styles.memberList}>
              {members.map((m: any, idx: number) => (
                <div key={m.id} className={styles.memberRow}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberAvatar}>
                      {getAvatar(m, idx)}
                    </div>
                    <div>
                      <div className={styles.memberName} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getDisplayName(m, idx)}
                        {myMemberIds.includes(m.id) && privacyMode && !isOwner && (
                          <span style={{ color: '#0d9488', fontSize: '0.75rem' }}>(Bạn)</span>
                        )}
                        {m.role === 'owner' && (
                          <span className={styles.ownerBadge} style={{ display: 'inline-flex', color: 'var(--secondary-500)' }}>
                            <IconOwner size={16} />
                          </span>
                        )}
                        {m.agreement_signed_at && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                            <IconConfirmed size={14} /> Đã ký
                          </span>
                        )}
                      </div>
                      <div className={styles.memberMeta}>
                        {m.payout_order ? `#${m.payout_order}` : '—'} · {m.shares} phần
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MemberStatusBadge status={m.status} />
                    {isOwner && m.role !== 'owner' && ['recruiting', 'pending_agreement'].includes(group.status) && (
                      <RemoveMemberButton memberId={m.id} memberName={getDisplayName(m, idx)} groupId={group.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Details */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Chi tiết cấu hình</h2>
            <div className={styles.detailGrid}>
              <DetailRow label="Ngày bắt đầu" value={formatDate(group.start_date)} />
              <DetailRow label="Phương thức lĩnh" value={PAYOUT_METHOD_LABELS[group.payout_method]} />
              <DetailRow label="Ngày gia hạn" value={`${group.grace_period_days} ngày`} />
              <DetailRow label="Tối đa phần/người" value={`${group.max_shares_per_member}`} />
              {group.commission_type !== 'none' && (
                <DetailRow 
                  label="Hoa hồng" 
                  value={group.commission_type === 'percentage' 
                    ? `${group.commission_amount}%` 
                    : formatVND(group.commission_amount)} 
                />
              )}
            </div>

            {/* Privacy Mode Toggle — VIP Feature */}
            {isOwner && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔒 Chế độ riêng tư
                      <Badge variant="primary" size="sm">💎 VIP</Badge>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Ẩn danh thành viên (Thành viên #1, #2...)
                    </div>
                  </div>
                  <PrivacyToggle groupId={group.id} enabled={privacyMode} />
                </div>
              </div>
            )}
            {!isOwner && privacyMode && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(22, 160, 133, 0.05)', borderRadius: '10px', border: '1px solid rgba(22, 160, 133, 0.15)', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔒 Dây hụi này đang bật <strong>Chế độ riêng tư</strong>. Bạn chỉ thấy tên của mình và chủ hụi.
              </div>
            )}
          </div>
        </div>

        {/* Right: Invite + Actions */}
        <div className={styles.sideCol}>
          {/* Invite Card */}
          {isOwner && group.invite_code && (
            <InviteCard 
              inviteCode={group.invite_code} 
              inviteUrl={`${APP_URL}/moi/${group.invite_code}`} 
            />
          )}

          {/* Quick Actions */}
          <div className={styles.actionsCard}>
            <h3>Hành động</h3>
            <div className={styles.actionList}>
              {isOwner && group.status === 'recruiting' && (
                <Link href={`/day-hui/${group.id}/thoa-thuan`} className={styles.actionItem}>
                  <span className={styles.actionIcon}><IconAgreement size={20} /></span>
                  <span>Tạo thỏa thuận</span>
                </Link>
              )}
              {group.status === 'pending_agreement' && (
                <Link href={`/day-hui/${group.id}/thoa-thuan`} className={styles.actionItem}>
                  <span className={styles.actionIcon}><IconAgreement size={20} /></span>
                  <span>Xem / Ký thỏa thuận</span>
                </Link>
              )}
              {['active', 'completed'].includes(group.status) && (
                <>
                  <Link href={`/day-hui/${group.id}/so-hui`} className={styles.actionItem}>
                    <span className={styles.actionIcon}><IconLedger size={20} /></span>
                    <span>Xem Sổ hụi</span>
                  </Link>
                  <Link href={`/day-hui/${group.id}/bien-nhan`} className={styles.actionItem}>
                    <span className={styles.actionIcon}><IconReceipt size={20} /></span>
                    <span>Biên nhận điện tử</span>
                  </Link>
                  <Link href={`/day-hui/${group.id}/disputes`} className={styles.actionItem}>
                    <span className={styles.actionIcon} style={{ color: 'var(--error-color)' }}><IconDisputed size={20} /></span>
                    <span>Quản lý Khiếu nại</span>
                  </Link>
                </>
              )}
              <CashflowButton group={group} periods={periods} />
              {isOwner && group.share_value * group.total_shares >= 100_000_000 && (
                <UBNDNoticeButton info={{
                  ownerName: members.find((m: any) => m.role === 'owner')?.user_profiles?.full_name || '',
                  groupName: group.name,
                  shareValue: group.share_value,
                  totalShares: group.total_shares,
                  cycleType: group.cycle_type,
                  startDate: group.start_date,
                  memberCount: members.filter((m: any) => !['removed', 'withdrawn'].includes(m.status)).length,
                  huiType: group.hui_type,
                  payoutMethod: group.payout_method,
                }} />
              )}
              {isOwner && <BankAccountSelector groupId={group.id} currentBankAccountId={group.receiving_bank_account_id} />}
              {isOwner && <GroupActions groupId={group.id} status={group.status} />}
              {!isOwner && ['recruiting', 'pending_agreement'].includes(group.status) && (
                <LeaveGroupButton groupId={group.id} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ChatBox for group members */}
      {user && ['active', 'completed', 'pending_agreement'].includes(group.status) && (
        <ChatBox groupId={group.id} currentUserId={user.id} groupName={group.name} privacyMode={privacyMode} isOwner={isOwner} ownerUserId={group.owner_id} />
      )}

      {/* Voting Panel */}
      {user && ['active', 'pending_agreement'].includes(group.status) && (
        <VotingPanel
          groupId={group.id}
          votes={votes}
          isOwner={isOwner}
          totalMembers={activeMemberCount}
        />
      )}
    </div>
  );
}

function MemberStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    invited: 'info', pending_kyc: 'warning', pending_approval: 'warning',
    pending_agreement: 'warning', active: 'success', late: 'error',
    suspended: 'error', completed: 'success', removed: 'default', withdrawn: 'default',
  };
  return (
    <Badge variant={variants[status] || 'default'} size="sm">
      {MEMBER_STATUS_LABELS[status] || status}
    </Badge>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
