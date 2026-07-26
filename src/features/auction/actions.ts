'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Chủ hụi mở phiên đấu giá (hoặc tự động 3 ngày trước hạn đóng)
export async function openAuction(periodId: string, options?: { skipRevalidate?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { data: period } = await supabase
    .from('hui_periods')
    .select('*, hui_groups(owner_id, payout_method)')
    .eq('id', periodId)
    .single();

  if (!period) return { error: 'Không tìm thấy kỳ hụi' };
  if (period.status !== 'upcoming') return { error: 'Kỳ này không ở trạng thái chờ mở' };
  
  const group = (period as any).hui_groups;
  if (group.owner_id !== user.id) return { error: 'Chỉ chủ hụi mới có thể mở đấu giá' };
  if (group.payout_method !== 'auction') return { error: 'Dây hụi này không dùng đấu giá' };

  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 24);

  await supabase
    .from('hui_periods')
    .update({ 
      status: 'draw_pending',
      auction_deadline: deadline.toISOString(),
    })
    .eq('id', periodId);

  if (!options?.skipRevalidate) {
    revalidatePath('/day-hui', 'layout');
  }
  return { success: true };
}

// Member gửi bid (hoặc cập nhật bid)
export async function submitBid(periodId: string, bidAmount: number, options?: { skipRevalidate?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  if (bidAmount <= 0) return { error: 'Số tiền bỏ phải lớn hơn 0' };

  // Get period + group info
  const { data: period } = await supabase
    .from('hui_periods')
    .select('*, hui_groups(share_value, total_shares, owner_id, min_bid, max_bid)')
    .eq('id', periodId)
    .single();

  if (!period) return { error: 'Không tìm thấy kỳ hụi' };
  if (period.status !== 'draw_pending') return { error: 'Kỳ này không ở trạng thái đấu giá' };

  const group = (period as any).hui_groups;
  const minRequired = group.min_bid || 0;
  
  if (bidAmount < minRequired) {
    return { error: `Số tiền bỏ phải từ ${minRequired.toLocaleString('vi-VN')} trở lên` };
  }
  
  if (group.max_bid !== null && group.max_bid !== undefined && bidAmount > group.max_bid) {
    return { error: `Số tiền bỏ không được vượt quá ${group.max_bid.toLocaleString('vi-VN')}` };
  }

  const maxPossibleBid = group.share_value * (group.total_shares - 1); // Max possible logically
  if (bidAmount > maxPossibleBid) return { error: 'Giá bỏ không hợp lý (cao hơn tổng hụi)' };

  // Check auction deadline
  if (period.auction_deadline && new Date(period.auction_deadline) < new Date()) {
    return { error: 'Đã hết thời gian đấu giá' };
  }

  // Get member
  const { data: member } = await supabase
    .from('hui_members')
    .select('id')
    .eq('group_id', period.group_id)
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'Bạn không phải thành viên nhóm này' };

  // Check if already received payout
  const { data: previousPayouts } = await supabase
    .from('hui_periods')
    .select('id')
    .eq('group_id', period.group_id)
    .eq('payout_member_id', member.id);

  if (previousPayouts && previousPayouts.length > 0) {
    return { error: 'Bạn đã lĩnh hụi rồi, không thể đấu giá' };
  }

  // Upsert bid
  const { error } = await supabase
    .from('auction_bids')
    .upsert({
      period_id: periodId,
      member_id: member.id,
      bid_amount: bidAmount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'period_id,member_id' });

  if (error) return { error: error.message };

  if (!options?.skipRevalidate) {
    revalidatePath('/day-hui', 'layout');
  }
  return { success: true };
}

// Chủ hụi chốt đấu giá
export async function finalizeAuction(periodId: string, options?: { skipRevalidate?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Get period + group info
  const { data: period } = await supabase
    .from('hui_periods')
    .select('*, hui_groups(*)')
    .eq('id', periodId)
    .single();

  if (!period) return { error: 'Không tìm thấy kỳ hụi' };
  if (period.status !== 'draw_pending') return { error: 'Kỳ này không ở trạng thái đấu giá' };
  
  const group = period.hui_groups;
  if (group.owner_id !== user.id) return { error: 'Chỉ chủ hụi mới có thể chốt' };

  // Get all bids for this period, ordered by amount DESC
  const { data: bids } = await supabase
    .from('auction_bids')
    .select('*, hui_members(id, shares, user_id, user_profiles!hui_members_user_id_fkey(full_name))')
    .eq('period_id', periodId)
    .order('bid_amount', { ascending: false });

  if (!bids || bids.length === 0) return { error: 'Chưa có ai bỏ giá' };

  // Winner = highest bidder
  const winnerBid = bids[0];
  const winnerId = winnerBid.member_id;
  const winningAmount = winnerBid.bid_amount;

  // Get all eligible members
  const { data: allMembers } = await supabase
    .from('hui_members')
    .select('id, shares, user_id')
    .eq('group_id', group.id)
    .gt('shares', 0)
    .not('status', 'in', '(removed,withdrawn)');

  if (!allMembers) return { error: 'Không tìm thấy thành viên' };

  // Calculate amounts:
  // Total shares paying = all shares - winner's shares
  const totalShares = allMembers.reduce((sum, m) => sum + m.shares, 0);
  const payingShares = totalShares - (allMembers.find(m => m.id === winnerId)?.shares || 0);
  
  // Member pays = shareValue - winning bid
  // In Vietnamese hui, the bid amount is the discount given per paying share.
  const discount = winningAmount;
  const memberPays = group.share_value - discount;

  // Commission
  let commissionDeducted = 0;
  if (group.commission_type === 'fixed_per_period') commissionDeducted = group.commission_amount || 0;
  if (group.commission_type === 'percentage') commissionDeducted = Math.round(group.share_value * payingShares * (group.commission_amount || 0) / 100);

  const totalCollected = memberPays * payingShares;
  const winnerReceives = totalCollected - commissionDeducted;

  // Update period
  const { error: updateError } = await supabase
    .from('hui_periods')
    .update({
      payout_member_id: winnerId,
      winning_bid_id: winnerBid.id,
      winning_bid_amount: winningAmount,
      payout_amount: totalCollected,
      commission_amount: commissionDeducted,
      status: 'payment_open',
    })
    .eq('id', periodId);

  if (updateError) return { error: updateError.message };

  // Generate contributions
  const contributionsToInsert = [];
  for (const m of allMembers) {
    const receivingShares = m.id === winnerId ? m.shares : 0;
    const sharesToPay = m.shares - receivingShares;
    if (sharesToPay > 0) {
      contributionsToInsert.push({
        period_id: periodId,
        member_id: m.id,
        share_number: sharesToPay,
        amount_due: sharesToPay * memberPays,
        status: 'pending',
      });
    }
  }

  // Create payout record
  await supabase.from('payouts').insert({
    period_id: periodId,
    recipient_member_id: winnerId,
    amount: totalCollected,
    commission_deducted: commissionDeducted,
    net_amount: winnerReceives,
    status: 'pending',
  });

  if (contributionsToInsert.length > 0) {
    await supabase.from('contributions').insert(contributionsToInsert);
  }

  const winnerName = (winnerBid as any).hui_members?.user_profiles?.full_name || 'Unknown';

  if (!options?.skipRevalidate) {
    revalidatePath('/day-hui', 'layout');
  }
  return { 
    success: true,
    winner: winnerName,
    winningBid: winningAmount,
    memberPays,
  };
}
