import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Badge from '@/components/ui/Badge';
import { formatVND } from '@/lib/constants';
import VietQR from '@/components/ui/VietQR';
import { SubmitProofButton, ConfirmPaymentButton, InitiatePayoutButton, ConfirmPayoutButton, RemindPaymentButton } from './ActionButtons';
import DrawButton from './DrawButton';
import AuctionPanel from './AuctionPanel';
import OpenAuctionButton from './OpenAuctionButton';
import DisputeButton from './DisputeButton';
import { IconPayment, IconSuccess, IconCycle, IconReceipt, IconConfirmed, IconPending, IconError } from '@/components/ui/Icons';
import styles from './page.module.css';

export const metadata = {
  title: 'Chi tiết kỳ hụi',
};

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ id: string; periodId: string }>;
}) {
  const { id, periodId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dang-nhap');
  }

  // 1. Lấy thông tin nhóm & chủ hụi
  const { data: group } = await supabase
    .from('hui_groups')
    .select('id, name, owner_id, receiving_bank_account_id, payout_method, share_value, total_shares, min_bid, max_bid, privacy_mode')
    .eq('id', id)
    .single();

  if (!group) notFound();
  
  const isOwner = group.owner_id === user.id;
  const privacyMode = group.privacy_mode === true;

  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('full_name, phone')
    .eq('id', group.owner_id)
    .single();

  let bankAccount = null;
  if (group.receiving_bank_account_id) {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', group.receiving_bank_account_id)
      .single();
    bankAccount = data;
  }

  // 2. Lấy thông tin kỳ hụi
  const { data: period } = await supabase
    .from('hui_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (!period) notFound();

  // 3. Lấy thông tin member của user hiện tại
  const { data: myMember } = await supabase
    .from('hui_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single();

  // 4. Lấy khoản phải đóng của user hiện tại
  let myContribution = null;
  if (myMember) {
    const { data: contrib } = await supabase
      .from('contributions')
      .select('*')
      .eq('period_id', periodId)
      .eq('member_id', myMember.id)
      .single();
    myContribution = contrib;
  }

  // 5. Lấy danh sách tất cả các khoản đóng cho tính minh bạch (Ai cũng xem được)
  let allContributions = [];
  let dbError = null;
  const { data: contribs, error: contribsErr } = await supabase
    .from('contributions')
    .select('*, hui_members(user_profiles!hui_members_user_id_fkey(full_name, phone))')
    .eq('period_id', periodId);
  dbError = contribsErr;
  if (contribsErr) console.error('Lỗi lấy danh sách đóng tiền:', contribsErr);
  allContributions = contribs || [];

  // 6. Lấy tên người lĩnh hụi kỳ này
  let payoutRecipientName: string | null = null;
  let payoutRecipientBank: any = null;
  if (period.payout_member_id) {
    const { data: payoutMember } = await supabase
      .from('hui_members')
      .select(`
        user_id,
        user_profiles!hui_members_user_id_fkey(full_name)
      `)
      .eq('id', period.payout_member_id)
      .single();
    
    payoutRecipientName = (payoutMember as any)?.user_profiles?.full_name || null;
    
    if (payoutMember?.user_id) {
      const { data: banks, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', payoutMember.user_id)
        .order('is_primary', { ascending: false })
        .limit(1);
      if (error) console.error("Error fetching bank account:", error);
      
      if (banks && banks.length > 0) {
        payoutRecipientBank = banks[0];
      }
    }
  }
  // 7. Cho bốc thăm: đếm số member eligible
  let eligibleDrawCount = 0;
  if (isOwner && period.status === 'draw_pending') {
    const { data: allMembersForDraw } = await supabase
      .from('hui_members')
      .select('id')
      .eq('group_id', id)
      .gt('shares', 0)
      .not('status', 'in', '(removed,withdrawn)');
    
    const { data: previousPayouts } = await supabase
      .from('hui_periods')
      .select('payout_member_id')
      .eq('group_id', id)
      .not('payout_member_id', 'is', null);
    
    const receivedSet = new Set((previousPayouts || []).map(p => p.payout_member_id));
    eligibleDrawCount = (allMembersForDraw || []).filter(m => !receivedSet.has(m.id)).length;
  }

  // 7.5 Auto-open đấu giá: 3 ngày trước hạn đóng
  if (period.status === 'upcoming' && group.payout_method === 'auction') {
    const dueDate = new Date(period.payment_due_date);
    const threeDaysBefore = new Date(dueDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    
    if (new Date() >= threeDaysBefore) {
      const { openAuction } = await import('@/features/auction/actions');
      await openAuction(periodId, { skipRevalidate: true });
      const { redirect } = await import('next/navigation');
      redirect(`/day-hui/${id}/ky/${periodId}`);
    }
  }

  // 8. Cho bỏ hụi: lấy bid của mình + tổng số bids (sealed)
  let myAuctionBid: any = null;
  let totalBidCount = 0;
  let ownerParticipates = false;
  let eligibleBidCount = 0;
  let bidParticipants: { memberId: string; name: string; hasBid: boolean }[] = [];
  if (period.status === 'draw_pending' && group.payout_method === 'auction') {
    // Lấy member IDs đã bỏ giá (thông qua RPC để vượt qua RLS của Đấu giá kín)
    const { data: bidMembers } = await supabase
      .rpc('get_auction_bid_member_ids', { p_period_id: periodId });
    const bidMemberIds = new Set((bidMembers || []).map((b: any) => b.member_id));
    totalBidCount = bidMemberIds.size;

    // Lấy eligible members (chưa lĩnh) kèm tên
    const { data: allMembersAuction } = await supabase
      .from('hui_members')
      .select('id, user_profiles!hui_members_user_id_fkey(full_name)')
      .eq('group_id', id)
      .gt('shares', 0)
      .not('status', 'in', '(removed,withdrawn)');
    
    const { data: prevPayoutsAuction } = await supabase
      .from('hui_periods')
      .select('payout_member_id')
      .eq('group_id', id)
      .not('payout_member_id', 'is', null);
    
    const receivedAuction = new Set((prevPayoutsAuction || []).map(p => p.payout_member_id));
    const eligibleMembers = (allMembersAuction || []).filter(m => !receivedAuction.has(m.id));
    eligibleBidCount = eligibleMembers.length;

    bidParticipants = eligibleMembers.map((m, idx) => {
      const realName = (m as any).user_profiles?.full_name || 'Thành viên';
      let displayName = realName;
      if (privacyMode && !isOwner) {
        const isSelf = myMember && m.id === myMember.id;
        if (!isSelf) displayName = `Thành viên #${idx + 1}`;
      }
      return {
        memberId: m.id,
        name: displayName,
        hasBid: bidMemberIds.has(m.id),
      };
    });

    // Lấy bid của user hiện tại
    if (myMember) {
      const { data: bid } = await supabase
        .from('auction_bids')
        .select('id, member_id, bid_amount')
        .eq('period_id', periodId)
        .eq('member_id', myMember.id)
        .single();
      myAuctionBid = bid;
    }

    // Check owner tham gia ko
    if (isOwner) {
      const { data: ownerMember } = await supabase
        .from('hui_members')
        .select('shares')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single();
      ownerParticipates = (ownerMember?.shares || 0) > 0;
    }

    // Auto-set deadline if missing (cho periods tạo trước khi có tính năng deadline)
    if (!period.auction_deadline) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      await supabase
        .from('hui_periods')
        .update({ auction_deadline: deadline.toISOString() })
        .eq('id', periodId);
      period.auction_deadline = deadline.toISOString();
    }

    // Auto-finalize: hết deadline + có ít nhất 1 bid
    if (period.auction_deadline && new Date(period.auction_deadline) < new Date() && totalBidCount > 0) {
      const { finalizeAuction } = await import('@/features/auction/actions');
      await finalizeAuction(periodId, { skipRevalidate: true });
      const { redirect } = await import('next/navigation');
      redirect(`/day-hui/${id}/ky/${periodId}`);
    }
  }

  const qrContent = `HUI ${group.name.substring(0, 10)} KY ${period.period_number} ${ownerProfile?.phone}`;

  return (
    <div className={styles.page}>
      {/* Thêm phần hiển thị debug error */}
      {dbError && (
        <div style={{ padding: 20, background: 'red', color: 'white', marginBottom: 20 }}>
          LỖI TRUY VẤN ĐÓNG TIỀN: {JSON.stringify(dbError)}
        </div>
      )}
      <div className={styles.header}>
        <Link href={`/day-hui/${id}`} className={styles.backLink}>← Quay lại dây hụi</Link>
        <div className={styles.headerMain} style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className={styles.title}>Kỳ {period.period_number}</h1>
            <Badge variant={
              period.status === 'payout_confirmed' ? 'success' :
              period.status === 'completed' ? 'info' :
              period.status === 'payment_open' ? 'warning' : 
              period.status === 'payout_pending' ? 'warning' :
              period.status === 'disputed' ? 'error' : 'default'
            }>
              {({
                upcoming: group.payout_method === 'auction' ? 'Chờ mở đấu giá' : 'Sắp tới',
                payment_open: 'Đang thu tiền',
                draw_pending: group.payout_method === 'auction' ? 'Đang đấu giá' : 'Chờ bốc thăm',
                completed: 'Chờ chủ hụi giải ngân', // DB 'completed' = all payments collected
                payout_pending: 'Chờ người lĩnh xác nhận', // Owner transferred, waiting for member
                payout_confirmed: 'Hoàn thành', // Member confirmed receipt
                disputed: 'Tranh chấp',
              } as Record<string, string>)[period.status] || period.status}
            </Badge>
          </div>
          <div>
            <DisputeButton groupId={id} periodId={periodId} />
          </div>
        </div>
      </div>

      {/* Người lĩnh hụi kỳ này */}
      <div className={styles.payoutRecipient}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className={styles.payoutLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <IconSuccess size={20} /> Người lĩnh hụi kỳ {period.period_number}:
            </span>
            <strong className={styles.payoutName}>
              {(() => {
                if (!payoutRecipientName) return 'Chưa xác định';
                if (!privacyMode || isOwner) return payoutRecipientName;
                if (myMember && period.payout_member_id === myMember.id) return payoutRecipientName;
                return 'Thành viên ẩn danh';
              })()}
            </strong>
          </div>
          {period.draw_server_hash && period.draw_server_seed && (
            <div style={{ textAlign: 'right' }}>
              <Badge variant="info" size="sm">✅ Đã kiểm chứng (Provably Fair)</Badge>
            </div>
          )}
        </div>

        {period.draw_server_hash && period.draw_server_seed && (
          <details style={{ marginTop: '1rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--primary)' }}>Xem chi tiết kiểm chứng (Provably Fair)</summary>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong>Server Hash (công khai trước khi bốc):</strong>
                <code style={{ display: 'block', wordBreak: 'break-all', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '4px', marginTop: '4px' }}>{period.draw_server_hash}</code>
              </div>
              <div>
                <strong>Server Seed (công khai sau khi bốc):</strong>
                <code style={{ display: 'block', wordBreak: 'break-all', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '4px', marginTop: '4px' }}>{period.draw_server_seed}</code>
              </div>
              <div>
                <strong>Client Seed:</strong>
                <code style={{ display: 'block', wordBreak: 'break-all', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '4px', marginTop: '4px' }}>{period.draw_client_seed}</code>
              </div>
              <p style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '0.75rem' }}>
                Bất kỳ ai cũng có thể tự kiểm tra lại thuật toán: <br/>
                1. <code>SHA256(Server_Seed) == Server_Hash</code> <br/>
                2. <code>SHA256(Server_Seed + "-" + Client_Seed)</code> quyết định người trúng.
              </p>
            </div>
          </details>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          {/* Chờ mở đấu giá */}
          {period.status === 'upcoming' && group.payout_method === 'auction' && (
            <div className={styles.card}>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary)' }}><IconPayment size={48} /></div>
                <h3 style={{ marginBottom: '0.5rem' }}>Chờ mở đấu giá</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Đấu giá sẽ tự động mở 3 ngày trước hạn đóng ({new Date(period.payment_due_date).toLocaleDateString('vi-VN')}).
                </p>
                {isOwner && (
                  <OpenAuctionButton periodId={periodId} />
                )}
              </div>
            </div>
          )}

          {/* Kết quả đấu giá (nếu đã chốt) */}
          {period.winning_bid_amount != null && period.status !== 'draw_pending' && period.status !== 'upcoming' && (
            <div className={styles.card} style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <h2 className={styles.cardTitle} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconSuccess size={24} /> Kết quả đấu giá
              </h2>
              <div className={styles.infoRow} style={{ marginBottom: '0.5rem' }}>
                <span className={styles.label}>Người trúng giá:</span>
                <span className={styles.valueHighlight} style={{ color: '#10b981' }}>
                  {(() => {
                    if (!payoutRecipientName) return 'Chưa xác định';
                    if (!privacyMode || isOwner) return payoutRecipientName;
                    if (myMember && period.payout_member_id === myMember.id) return payoutRecipientName;
                    return 'Thành viên ẩn danh';
                  })()}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Số tiền bỏ (lãi):</span>
                <span className={styles.value}>{formatVND(period.winning_bid_amount)}</span>
              </div>
            </div>
          )}

          {/* Bốc thăm / Đấu giá */}
          {period.status === 'draw_pending' && (
            <div className={styles.card}>
              {group.payout_method === 'draw' && isOwner && (
                <DrawButton period={period} eligibleCount={eligibleDrawCount} />
              )}
              {group.payout_method === 'draw' && !isOwner && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary)' }}><IconCycle size={48} /></div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Chờ bốc thăm</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Chủ hụi sẽ bốc thăm để xác định người lĩnh hụi kỳ này.
                  </p>
                </div>
              )}
              {group.payout_method === 'auction' && (
                <AuctionPanel
                  periodId={periodId}
                  shareValue={group.share_value}
                  totalShares={group.total_shares}
                  isOwner={isOwner}
                  ownerParticipates={ownerParticipates}
                  myMemberId={myMember?.id}
                  myBid={myAuctionBid}
                  totalBidCount={totalBidCount}
                  eligibleCount={eligibleBidCount}
                  participants={bidParticipants}
                  deadline={period.auction_deadline}
                  minBid={group.min_bid}
                  maxBid={group.max_bid}
                />
              )}
            </div>
          )}

          {/* Form nộp tiền cho member (bao gồm cả chủ hụi nếu chủ hụi phải đóng) */}
          {myContribution && myContribution.amount_due > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thông tin nộp tiền</h2>
              
              <div className={styles.paymentInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Số tiền cần nộp:</span>
                  <span className={styles.valueHighlight}>{formatVND(myContribution.amount_due)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Hạn chót:</span>
                  <span className={styles.value}>{new Date(period.payment_due_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Trạng thái:</span>
                  <Badge variant={myContribution.status === 'confirmed' ? 'success' : myContribution.status === 'proof_submitted' ? 'info' : 'warning'}>
                    {myContribution.status === 'confirmed' ? 'Đã xác nhận' : 
                     myContribution.status === 'proof_submitted' ? 'Chờ duyệt' : 'Chưa đóng'}
                  </Badge>
                </div>
              </div>

              {myContribution.status === 'pending' && (
                <div className={styles.qrSection}>
                  <h3 className={styles.qrTitle}>Quét mã VietQR để thanh toán</h3>
                  <VietQR 
                    bankId={bankAccount?.bank_bin || 'MB'} 
                    accountNo={bankAccount?.account_number_encrypted || ownerProfile?.phone || ''} 
                    accountName={bankAccount?.account_name || ownerProfile?.full_name || 'CHỦ HỤI'} 
                    amount={myContribution.amount_due}
                    content={qrContent}
                  />
                  <SubmitProofButton contributionId={myContribution.id} periodId={periodId} groupId={id} />
                </div>
              )}

              {myContribution.status === 'proof_submitted' && (
                <div className={styles.proofSubmitted}>
                  <div className={styles.proofSubmittedIcon} style={{ color: 'var(--primary)' }}><IconReceipt size={32} /></div>
                  <h3 className={styles.proofSubmittedTitle}>Đã gửi xác nhận chuyển khoản</h3>
                  <p className={styles.proofSubmittedDesc}>
                    Chủ hụi đã nhận được thông báo và sẽ kiểm tra, xác nhận trong thời gian sớm nhất.
                    Trạng thái sẽ tự động cập nhật khi chủ hụi duyệt.
                  </p>
                </div>
              )}

              {myContribution.status === 'confirmed' && (
                <div className={styles.proofSubmitted} style={{ borderColor: 'var(--success-color)' }}>
                  <div className={styles.proofSubmittedIcon} style={{ color: 'var(--success-color)' }}><IconConfirmed size={32} /></div>
                  <h3 className={styles.proofSubmittedTitle}>Đã được xác nhận</h3>
                  <p className={styles.proofSubmittedDesc}>
                    Chủ hụi đã xác nhận khoản đóng của bạn cho kỳ này. Cảm ơn bạn!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Danh sách nộp tiền (Hiển thị cho tất cả thành viên) */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Danh sách thu tiền (Kỳ {period.period_number})</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    {isOwner && <th>Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {allContributions.map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <div className={styles.memberName}>
                          {(() => {
                            const name = c.hui_members?.user_profiles?.full_name;
                            if (!privacyMode || isOwner) return name;
                            if (c.member_id === myMember?.id) return name;
                            return `Thành viên ẩn danh`;
                          })()}
                          {c.member_id === myMember?.id && <span style={{ color: '#0d9488', fontSize: '0.75rem', marginLeft: '0.25rem' }}>(Bạn)</span>}
                        </div>
                        {isOwner && <div className={styles.memberPhone}>{c.hui_members?.user_profiles?.phone}</div>}
                      </td>
                      <td>{formatVND(c.amount_due)}</td>
                      <td>
                        <Badge variant={c.status === 'confirmed' ? 'success' : c.status === 'proof_submitted' ? 'info' : 'warning'} size="sm">
                          {c.status === 'confirmed' ? 'Đã đóng' : 
                           c.status === 'proof_submitted' ? 'Chờ duyệt' : 'Chưa đóng'}
                        </Badge>
                      </td>
                      {isOwner && (
                        <td>
                          {c.status === 'proof_submitted' && (
                            <ConfirmPaymentButton contributionId={c.id} periodId={periodId} groupId={id} />
                          )}
                          {c.status === 'pending' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className={styles.actionPending} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><IconPending size={14} /> Chờ member</span>
                              <RemindPaymentButton groupId={id} periodId={periodId} memberId={c.member_id} />
                            </div>
                          )}
                          {c.status === 'confirmed' && (
                            <span className={styles.actionConfirmed} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><IconConfirmed size={14} /> Đã duyệt</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {allContributions.length === 0 && (
                    <tr>
                      <td colSpan={isOwner ? 4 : 3} className={styles.emptyTable}>Không có người cần đóng kỳ này</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Thông tin giải ngân</h2>
            <div className={styles.infoRow}>
              <span className={styles.label}>Tổng tiền:</span>
              <span className={styles.value}>{formatVND(period.payout_amount)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Hoa hồng:</span>
              <span className={styles.value}>{formatVND(period.commission_amount)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Thực nhận:</span>
              <span className={styles.valueHighlight}>{formatVND(period.payout_amount - period.commission_amount)}</span>
            </div>
            <div className={styles.infoRow} style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
              <span className={styles.label}>Trạng thái:</span>
              <Badge variant={period.status === 'payout_confirmed' ? 'success' : period.status === 'payout_pending' ? 'info' : 'warning'}>
                {period.status === 'payout_confirmed' ? 'Đã nhận tiền' : 
                 period.status === 'payout_pending' ? 'Chủ hụi đã chuyển khoản' : 'Chưa giải ngân'}
              </Badge>
            </div>

            {/* Chủ hụi: nút xác nhận đã chuyển */}
            {isOwner && period.status === 'completed' && payoutRecipientName && (
              <div className={styles.payoutAction}>
                <h3 className={styles.payoutActionTitle}>Chuyển tiền cho {payoutRecipientName}</h3>
                
                {payoutRecipientBank ? (
                  <div style={{ marginBottom: '1.5rem', background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px' }}>
                    <VietQR 
                      bankId={payoutRecipientBank.bank_bin}
                      accountNo={payoutRecipientBank.account_number_encrypted}
                      accountName={payoutRecipientBank.account_name}
                      amount={period.payout_amount - period.commission_amount}
                      content={`Giai ngan hui ky ${period.period_number}`}
                    />
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                      <strong>{payoutRecipientBank.bank_bin}</strong> - {payoutRecipientBank.account_number_encrypted}<br/>
                      Chủ tài khoản: {payoutRecipientBank.account_name}
                    </div>
                  </div>
                ) : (
                  <div className={styles.warning} style={{ marginBottom: '1rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <IconError size={20} style={{ flexShrink: 0 }} />
                    <span>{payoutRecipientName} chưa cập nhật thông tin tài khoản ngân hàng. Bạn có thể chuyển khoản bằng phương thức khác và tải ảnh hóa đơn lên.</span>
                  </div>
                )}
                
                <InitiatePayoutButton periodId={periodId} recipientName={payoutRecipientName} />
              </div>
            )}

            {/* Chủ hụi: đang chờ người lĩnh xác nhận */}
            {isOwner && period.status === 'payout_pending' && (
              <div className={styles.payoutStatus}>
                <span className={styles.payoutStatusIcon} style={{ color: 'var(--warning-600)' }}><IconPending size={32} /></span>
                <p>Đang chờ <strong>{payoutRecipientName}</strong> xác nhận đã nhận tiền</p>
                {period.payout_evidence_url && period.payout_evidence_url !== 'undefined' && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Bằng chứng đã gửi:</p>
                    <img 
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-evidence/${period.payout_evidence_url}`} 
                      alt="Bằng chứng giải ngân" 
                      style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Trạng thái hoàn thành */}
            {(period.status === 'payout_confirmed') && (
              <div className={styles.payoutDone}>
                <span className={styles.payoutStatusIcon} style={{ color: 'var(--success-color)' }}><IconSuccess size={32} /></span>
                <p>Kỳ hụi đã hoàn thành! Tiền đã được giải ngân cho <strong>{(() => {
                  if (!payoutRecipientName) return 'thành viên';
                  if (!privacyMode || isOwner) return payoutRecipientName;
                  if (myMember && period.payout_member_id === myMember.id) return payoutRecipientName;
                  return 'thành viên ẩn danh';
                })()}</strong>.</p>
              </div>
            )}
          </div>

          {/* Người lĩnh: xác nhận đã nhận tiền */}
          {!isOwner && period.status === 'payout_pending' && myMember && period.payout_member_id === myMember.id && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Xác nhận nhận tiền</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Chủ hụi đã xác nhận giao <strong>{formatVND(period.payout_amount - period.commission_amount)}</strong> cho bạn.
                {period.payout_evidence_url && period.payout_evidence_url !== 'undefined' ? ' Vui lòng kiểm tra chứng từ bên dưới và xác nhận.' : ' (Giao dịch tiền mặt không có ảnh chứng từ). Vui lòng xác nhận.'}
              </p>

              {period.payout_evidence_url && period.payout_evidence_url !== 'undefined' && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <img 
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-evidence/${period.payout_evidence_url}`} 
                    alt="Bằng chứng giải ngân" 
                    style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid var(--border)' }} 
                  />
                </div>
              )}

              <ConfirmPayoutButton periodId={periodId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
