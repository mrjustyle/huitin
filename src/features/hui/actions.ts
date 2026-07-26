'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type HuiGroupState = {
  error?: string;
  success?: boolean;
  groupId?: string;
} | undefined;

export async function createHuiGroup(prevState: HuiGroupState, formData: FormData): Promise<HuiGroupState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Check Owner KYC Status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single();

  if (profile?.kyc_status !== 'approved') {
    return { error: 'Bạn cần hoàn tất Xác minh danh tính (KYC) để được phép mở dây hụi' };
  }

  // Check VIP group limit
  const { canCreateGroup } = await import('@/features/subscription/actions');
  const groupCheck = await canCreateGroup(user.id);
  if (!groupCheck.allowed) {
    return { error: groupCheck.reason || 'Đã đạt giới hạn số dây hụi' };
  }

  // Parse form data
  const name = formData.get('name') as string;
  const huiType = formData.get('huiType') as string;
  const shareValue = parseInt(formData.get('shareValue') as string);
  const totalShares = parseInt(formData.get('totalShares') as string);
  const maxSharesPerMember = parseInt(formData.get('maxSharesPerMember') as string) || 1;
  const cycleType = formData.get('cycleType') as string;
  const startDate = formData.get('startDate') as string;
  const paymentDayOfMonth = parseInt(formData.get('paymentDayOfMonth') as string) || null;
  const drawDayOfMonth = parseInt(formData.get('drawDayOfMonth') as string) || null;
  const gracePeriodDays = parseInt(formData.get('gracePeriodDays') as string) || 3;
  let payoutMethod = 'fixed_order';
  if (huiType === 'boc_tham') payoutMethod = 'draw';
  if (huiType === 'bo_hui') payoutMethod = 'auction';
  if (huiType === 'boc_tham_lai_co_dinh') payoutMethod = 'draw';
  const commissionType = formData.get('commissionType') as string || 'none';
  const commissionAmount = parseInt(formData.get('commissionAmount') as string) || 0;
  const receivingBankAccountId = formData.get('receivingBankAccountId') as string || null;
  const ownerAddress = formData.get('ownerAddress') as string || null;
  const ownerParticipates = formData.get('ownerParticipates') as string === 'yes';
  const ownerShares = ownerParticipates ? (parseInt(formData.get('ownerShares') as string) || 1) : 0;
  const minBidStr = formData.get('minBid') as string;
  const maxBidStr = formData.get('maxBid') as string;
  const minBid = huiType === 'bo_hui' && minBidStr ? parseInt(minBidStr) : null;
  const maxBid = huiType === 'bo_hui' && maxBidStr ? parseInt(maxBidStr) : null;
  const fixedInterestAmountStr = formData.get('fixedInterestAmount') as string;
  const fixedInterestAmount = huiType === 'boc_tham_lai_co_dinh' && fixedInterestAmountStr ? parseInt(fixedInterestAmountStr) : null;
  const requireKyc = formData.get('requireKyc') === 'true';

  // Validation
  if (!name || !huiType || !shareValue || !totalShares || !cycleType || !startDate || !payoutMethod) {
    return { error: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
  }

  if (shareValue < 100000) {
    return { error: 'Giá trị phần hụi tối thiểu 100.000 ₫' };
  }

  if (totalShares < 2 || totalShares > 100) {
    return { error: 'Số phần hụi phải từ 2 đến 100' };
  }

  if (ownerParticipates && ownerShares > totalShares) {
    return { error: 'Số phần tham gia của chủ hụi không được lớn hơn tổng số phần của dây hụi' };
  }

  if (huiType === 'bo_hui' && minBid !== null && maxBid !== null && minBid > maxBid) {
    return { error: 'Giá bỏ tối đa phải lớn hơn giá bỏ tối thiểu' };
  }

  // Legal threshold warning (NĐ 19/2019: 100 triệu / dây hụi cần thông báo)
  const totalValue = shareValue * totalShares;

  // Generate invite code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let inviteCode = '';
  for (let i = 0; i < 6; i++) {
    inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Create group
  const { data: group, error } = await supabase
    .from('hui_groups')
    .insert({
      name,
      owner_id: user.id,
      hui_type: huiType,
      share_value: shareValue,
      total_shares: totalShares,
      max_shares_per_member: maxSharesPerMember,
      cycle_type: cycleType,
      start_date: startDate,
      payment_day_of_month: paymentDayOfMonth,
      draw_day_of_month: drawDayOfMonth,
      grace_period_days: gracePeriodDays,
      payout_method: payoutMethod,
      commission_type: commissionType,
      commission_amount: commissionAmount,
      receiving_bank_account_id: receivingBankAccountId || null,
      owner_address: ownerAddress,
      status: 'recruiting',
      invite_code: inviteCode,
      min_bid: minBid,
      max_bid: maxBid,
      fixed_interest_amount: fixedInterestAmount,
      require_kyc: requireKyc,
    })
    .select('id')
    .single();

  if (error) {
    if (error.message.includes('hui_groups_invite_code_key')) {
      // Retry with new code
      return { error: 'Lỗi tạo mã mời, vui lòng thử lại' };
    }
    return { error: error.message };
  }

  // Add owner as member (manager role always, but only with shares if participating)
  const { error: memberError } = await supabase.from('hui_members').insert({
    group_id: group.id,
    user_id: user.id,
    shares: ownerShares,
    payout_order: ownerParticipates ? 1 : null,
    status: 'active',
    role: 'owner',
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    console.error('Failed to add owner as member:', memberError.message);
  }

  // Update owner's active groups count
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('active_groups_as_owner')
    .eq('id', user.id)
    .single();

  await supabase
    .from('user_profiles')
    .update({
      active_groups_as_owner: (currentProfile?.active_groups_as_owner || 0) + 1,
    })
    .eq('id', user.id);

  revalidatePath('/day-hui');
  redirect(`/day-hui/${group.id}`);
}

export async function getMyGroups() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get groups where user is a member
  const { data: memberships } = await supabase
    .from('hui_members')
    .select('group_id, role, shares, status')
    .eq('user_id', user.id)
    .not('status', 'in', '(removed,withdrawn)');

  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups } = await supabase
    .from('hui_groups')
    .select(`
      id, name, hui_type, share_value, total_shares,
      cycle_type, start_date, payout_method, status,
      invite_code, created_at, require_kyc
    `)
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  // Fetch all active members for these groups to calculate counts
  const { data: allMembersData } = await supabase
    .from('hui_members')
    .select('group_id')
    .in('group_id', groupIds)
    .not('status', 'in', '(removed,withdrawn)');

  // Merge with membership info and member counts
  return (groups || []).map((g) => {
    const membership = memberships.find((m) => m.group_id === g.id);
    const current_members = (allMembersData || []).filter(m => m.group_id === g.id).length;
    return {
      ...g,
      current_members,
      my_role: membership?.role || 'member',
      my_shares: membership?.shares || 1,
      my_status: membership?.status || 'active',
    };
  });
}

export async function getGroupDetail(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: group } = await supabase
    .from('hui_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (!group) return null;

  // Get members (without profile join — FK goes to auth.users, not user_profiles)
  const { data: members, error: membersError } = await supabase
    .from('hui_members')
    .select('id, user_id, shares, payout_order, status, role, joined_at, agreement_signed_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (membersError) {
    console.error('[getGroupDetail] members error:', membersError.message);
  }

  // Fetch profiles for all members
  const memberUserIds = (members || []).map((m) => m.user_id);
  let profiles: Record<string, any> = {};

  if (memberUserIds.length > 0) {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone, avatar_url, kyc_status, on_time_rate')
      .in('id', memberUserIds);

    if (profileData) {
      profiles = Object.fromEntries(profileData.map((p) => [p.id, p]));
    }
  }

  // Merge
  const membersWithProfiles = (members || []).map((m) => ({
    ...m,
    user_profiles: profiles[m.user_id] || null,
  }));

  // Get periods
  const { data: periods } = await supabase
    .from('hui_periods')
    .select('*')
    .eq('group_id', groupId)
    .order('period_number', { ascending: true });

  // Get current user's contributions for this group
  const myMemberIds = membersWithProfiles.filter(m => m.user_id === user.id).map(m => m.id);
  let myContributions: any[] = [];
  if (myMemberIds.length > 0) {
    const { data: contribs } = await supabase
      .from('contributions')
      .select('*')
      .in('member_id', myMemberIds)
      .eq('status', 'confirmed');
    myContributions = contribs || [];
  }

  return {
    group,
    members: membersWithProfiles,
    periods: periods || [],
    isOwner: group.owner_id === user.id,
    myContributions,
    myMemberIds,
  };
}

export async function joinGroupByInvite(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Find group by invite code
  const { data: group } = await supabase
    .from('hui_groups')
    .select('id, name, status, total_shares, invite_max_uses, invite_used_count, require_kyc')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (!group) {
    return { error: 'Mã mời không hợp lệ hoặc đã hết hạn' };
  }

  if (group.status !== 'recruiting') {
    return { error: 'Dây hụi này không còn nhận thành viên mới' };
  }

  // Check if group is already full
  const { count } = await supabase
    .from('hui_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', group.id)
    .not('status', 'in', '(removed,withdrawn)');

  if (count !== null && count >= group.total_shares) {
    return { error: 'Dây hụi đã đủ số lượng thành viên' };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('hui_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { error: 'Bạn đã là thành viên của dây hụi này' };
  }

  if (group.require_kyc) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .single();
    
    if (profile?.kyc_status !== 'approved') {
      return { error: 'Dây hụi này yêu cầu Hụi viên phải Xác minh danh tính (KYC) để tham gia' };
    }
  }
  // Add member
  const { error } = await supabase.from('hui_members').insert({
    group_id: group.id,
    user_id: user.id,
    status: 'active',
    role: 'member',
  });

  if (error) {
    return { error: error.message };
  }

  // Increment invite used count
  await supabase
    .from('hui_groups')
    .update({ invite_used_count: (group.invite_used_count || 0) + 1 })
    .eq('id', group.id);

  revalidatePath('/day-hui');
  return { success: true, groupId: group.id, groupName: group.name };
}

export async function updateMemberStatus(memberId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Verify caller is group owner
  const { data: member } = await supabase
    .from('hui_members')
    .select('group_id')
    .eq('id', memberId)
    .single();

  if (!member) return;

  const { data: group } = await supabase
    .from('hui_groups')
    .select('owner_id')
    .eq('id', member.group_id)
    .single();

  if (group?.owner_id !== user.id) return;

  await supabase
    .from('hui_members')
    .update({ status: newStatus })
    .eq('id', memberId);

  revalidatePath(`/day-hui/${member.group_id}`);
}

export async function removeMember(memberId: string, groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Verify owner
  const { data: group } = await supabase
    .from('hui_groups')
    .select('owner_id, status')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return { error: 'Chỉ chủ hụi mới có thể xóa thành viên' };
  }

  if (!['recruiting', 'pending_agreement'].includes(group.status)) {
    return { error: 'Không thể xóa thành viên khi dây hụi đang chạy' };
  }

  // Cannot remove self (owner)
  const { data: member } = await supabase
    .from('hui_members')
    .select('user_id, role')
    .eq('id', memberId)
    .single();

  if (!member) return { error: 'Không tìm thấy thành viên' };
  if (member.role === 'owner') return { error: 'Không thể xóa chủ hụi' };

  // Delete member
  await supabase.from('hui_members').delete().eq('id', memberId);

  revalidatePath(`/day-hui/${groupId}`);
  return { success: true };
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Check group status
  const { data: group } = await supabase
    .from('hui_groups')
    .select('status, owner_id')
    .eq('id', groupId)
    .single();

  if (!group) return { error: 'Không tìm thấy dây hụi' };
  
  if (!['recruiting', 'pending_agreement'].includes(group.status)) {
    return { error: 'Không thể rời dây hụi khi đã bắt đầu chạy' };
  }

  if (group.owner_id === user.id) {
    return { error: 'Chủ hụi không thể rời dây hụi (chỉ có thể hủy hoặc xóa dây hụi)' };
  }

  // Delete own membership
  const { error } = await supabase
    .from('hui_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath(`/day-hui/${groupId}`);
  revalidatePath('/day-hui');
  return { success: true };
}

export async function cancelGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { data: group } = await supabase
    .from('hui_groups')
    .select('owner_id, status')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return { error: 'Chỉ chủ hụi mới có thể hủy' };
  }

  if (group.status === 'active') {
    return { error: 'Không thể hủy dây hụi đang hoạt động. Liên hệ hỗ trợ.' };
  }

  await supabase
    .from('hui_groups')
    .update({ status: 'cancelled' })
    .eq('id', groupId);

  revalidatePath('/day-hui');
  return { success: true };
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { data: group } = await supabase
    .from('hui_groups')
    .select('owner_id, status')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return { error: 'Chỉ chủ hụi mới có thể xóa' };
  }

  if (!['draft', 'recruiting', 'completed'].includes(group.status)) {
    return { error: 'Chỉ xóa được dây hụi chưa bắt đầu hoặc đã kết thúc' };
  }

  // Delete members first (FK constraint)
  await supabase.from('hui_members').delete().eq('group_id', groupId);
  // Delete group
  const { error } = await supabase.from('hui_groups').delete().eq('id', groupId);

  if (error) return { error: error.message };

  revalidatePath('/day-hui');
  redirect('/day-hui');
}

export async function updateGroupBankAccount(groupId: string, bankAccountId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Verify ownership
  const { data: group } = await supabase
    .from('hui_groups')
    .select('owner_id')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return { error: 'Bạn không phải chủ hụi' };
  }

  const { error } = await supabase
    .from('hui_groups')
    .update({ receiving_bank_account_id: bankAccountId || null })
    .eq('id', groupId);

  if (error) return { error: error.message };

  revalidatePath(`/day-hui/${groupId}`, 'layout');
  revalidatePath(`/day-hui`);
  return { success: true };
}
