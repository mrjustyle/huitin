'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { formatVND } from '@/lib/constants';
import { calculateCashflow } from '@/features/hui/cashflow';

export type AgreementState = {
  error?: string;
  success?: boolean;
} | undefined;

/**
 * Generate agreement content from group config
 */
export async function generateAgreement(groupId: string): Promise<AgreementState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Verify owner
  const { data: group } = await supabase
    .from('hui_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return { error: 'Chỉ chủ hụi mới có thể tạo thỏa thuận' };
  }

  // Get members (separate queries to avoid FK join issue)
  const { data: members } = await supabase
    .from('hui_members')
    .select('id, user_id, shares, payout_order, role, status')
    .eq('group_id', groupId)
    .not('status', 'in', '(removed,withdrawn)')
    .order('created_at', { ascending: true });

  if (!members || members.length < 2) {
    return { error: `Cần ít nhất 2 thành viên để tạo thỏa thuận (hiện có ${members?.length ?? 0})` };
  }

  // Fetch profiles for members
  const memberUserIds = members.map((m) => m.user_id);
  const { data: profilesData } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone, address')
    .in('id', memberUserIds);
  const profileMap: Record<string, any> = Object.fromEntries(
    (profilesData || []).map((p) => [p.id, p])
  );

  // Get owner profile
  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('full_name, phone, address')
    .eq('id', user.id)
    .single();

  const huiTypeLabels: Record<string, string> = {
    khong_lai: 'Hụi không lãi',
    boc_tham: 'Hụi bốc thăm',
    bo_hui: 'Hụi bỏ (có lãi)',
  };

  const cycleLabels: Record<string, string> = {
    daily: 'hàng ngày',
    weekly: 'hàng tuần',
    biweekly: 'hai tuần một lần',
    monthly: 'hàng tháng',
  };

  const payoutLabels: Record<string, string> = {
    fixed_order: 'theo thứ tự cố định',
    draw: 'bốc thăm',
    auction: 'đấu giá (bỏ hụi)',
  };

  // Build agreement content
  const content = {
    version: group.agreement_version || 1,
    generatedAt: new Date().toISOString(),
    groupName: group.name,
    groupId: group.id,

    owner: {
      name: ownerProfile?.full_name || '',
      phone: ownerProfile?.phone || '',
      address: ownerProfile?.address || group.owner_address || '',
    },

    terms: {
      huiType: huiTypeLabels[group.hui_type] || group.hui_type,
      shareValue: group.share_value,
      shareValueText: formatVND(group.share_value),
      totalShares: group.total_shares,
      totalValue: group.share_value * group.total_shares,
      totalValueText: formatVND(group.share_value * group.total_shares),
      cycleType: cycleLabels[group.cycle_type] || group.cycle_type,
      startDate: group.start_date,
      payoutMethod: payoutLabels[group.payout_method] || group.payout_method,
      gracePeriodDays: group.grace_period_days,
      maxSharesPerMember: group.max_shares_per_member,
      commissionType: group.commission_type,
      commissionAmount: group.commission_amount,
    },

    members: members.map((m: any) => ({
      memberId: m.id,
      userId: m.user_id,
      name: profileMap[m.user_id]?.full_name || '',
      phone: profileMap[m.user_id]?.phone || '',
      shares: m.shares,
      payoutOrder: m.payout_order,
      role: m.role,
    })),

    articles: [
      {
        title: 'Điều 1: Thông tin dây hụi',
        content: `Dây hụi "${group.name}" là ${huiTypeLabels[group.hui_type]} với giá trị mỗi phần hụi là ${formatVND(group.share_value)}, gồm ${group.total_shares} phần, tổng giá trị ${formatVND(group.share_value * group.total_shares)}. Chu kỳ đóng hụi: ${cycleLabels[group.cycle_type]}. Ngày bắt đầu: ${new Date(group.start_date).toLocaleDateString('vi-VN')}.`,
      },
      {
        title: 'Điều 2: Phương thức lĩnh hụi',
        content: `Người lĩnh hụi được xác định ${payoutLabels[group.payout_method]}. Mỗi thành viên chỉ được lĩnh hụi 1 lần trong suốt dây hụi.`,
      },
      {
        title: 'Điều 3: Nghĩa vụ đóng hụi',
        content: `Mỗi thành viên phải đóng đúng hạn. Thời hạn gia hạn: ${group.grace_period_days} ngày. Sau thời hạn gia hạn, thành viên bị ghi nhận đóng trễ và có thể bị xử lý theo quy định.`,
      },
      {
        title: 'Điều 4: Xác nhận giao dịch',
        content: `Mọi giao dịch đóng hụi và lĩnh hụi phải được xác nhận bởi cả hai bên (người đóng/lĩnh và chủ hụi). Chứng từ chuyển khoản phải được tải lên hệ thống.`,
      },
      {
        title: 'Điều 5: Hoa hồng chủ hụi',
        content: group.commission_type === 'none'
          ? 'Chủ hụi không thu hoa hồng.'
          : `Chủ hụi thu hoa hồng ${group.commission_type === 'percentage' ? `${group.commission_amount}%` : formatVND(group.commission_amount)} mỗi kỳ.`,
      },
      {
        title: 'Điều 6: Tranh chấp',
        content: 'Mọi tranh chấp được giải quyết trước hết bằng thương lượng giữa các bên trên nền tảng. Nếu không đạt thỏa thuận, các bên có quyền khiếu nại lên chính quyền địa phương theo Nghị định 19/2019/NĐ-CP.',
      },
      {
        title: 'Điều 7: Cam kết',
        content: 'Bằng việc ký xác nhận thỏa thuận này, các thành viên cam kết tuân thủ đầy đủ các điều khoản trên và chịu trách nhiệm về nghĩa vụ tài chính của mình.',
      },
    ],

    legalNotice: group.share_value * group.total_shares >= 100_000_000
      ? 'Dây hụi có giá trị từ 100 triệu VND trở lên. Theo Nghị định 19/2019/NĐ-CP, chủ hụi có nghĩa vụ thông báo UBND cấp xã nơi cư trú.'
      : null,
  };

  // Hash content for integrity check
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(content));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const checksum = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Upsert agreement
  const { error } = await supabase
    .from('hui_agreements')
    .upsert(
      {
        group_id: groupId,
        version: content.version,
        content,
        checksum,
        created_by: user.id,
      },
      { onConflict: 'group_id,version' }
    );

  if (error) return { error: error.message };

  // Update group status
  await supabase
    .from('hui_groups')
    .update({ status: 'pending_agreement' })
    .eq('id', groupId);

  // Update all active members to pending_agreement
  await supabase
    .from('hui_members')
    .update({ status: 'pending_agreement' })
    .eq('group_id', groupId)
    .eq('status', 'active');

  revalidatePath(`/day-hui/${groupId}`);
  return { success: true };
}

/**
 * Sign agreement (OTP simplified — just confirm for MVP)
 */
export async function signAgreement(groupId: string): Promise<AgreementState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Get latest agreement
  const { data: agreement } = await supabase
    .from('hui_agreements')
    .select('id, version')
    .eq('group_id', groupId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (!agreement) return { error: 'Chưa có thỏa thuận' };

  // Get member
  const { data: member } = await supabase
    .from('hui_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'Bạn không phải thành viên' };

  // Check if already signed
  const { data: existing } = await supabase
    .from('agreement_signatures')
    .select('id')
    .eq('agreement_id', agreement.id)
    .eq('member_id', member.id)
    .single();

  if (existing) return { error: 'Bạn đã ký thỏa thuận này rồi' };

  // Create signature
  const { error } = await supabase
    .from('agreement_signatures')
    .insert({
      agreement_id: agreement.id,
      member_id: member.id,
      user_id: user.id,
      otp_verified: true, // MVP: simplified
    });

  if (error) return { error: error.message };

  // Update member
  await supabase
    .from('hui_members')
    .update({
      agreement_signed_at: new Date().toISOString(),
      agreement_version_signed: agreement.version,
      status: 'active',
    })
    .eq('id', member.id);

  revalidatePath(`/day-hui/${groupId}`);
  return { success: true };
}

/**
 * Get agreement data
 */
export async function getAgreement(groupId: string) {
  const supabase = await createClient();

  const { data: agreement } = await supabase
    .from('hui_agreements')
    .select('*')
    .eq('group_id', groupId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (!agreement) return null;

  // Get signatures (without nested FK join)
  const { data: signatures } = await supabase
    .from('agreement_signatures')
    .select('id, member_id, user_id, signed_at, otp_verified')
    .eq('agreement_id', agreement.id);

  // Get signer profiles
  const signerIds = (signatures || []).map((s) => s.user_id);
  let signerProfiles: Record<string, any> = {};
  if (signerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', signerIds);
    signerProfiles = Object.fromEntries(
      (profiles || []).map((p) => [p.id, p])
    );
  }

  const signaturesWithNames = (signatures || []).map((s) => ({
    ...s,
    full_name: signerProfiles[s.user_id]?.full_name || '',
  }));

  return { agreement, signatures: signaturesWithNames };
}

/**
 * Activate group — check all conditions and generate periods
 */
export async function activateGroup(groupId: string): Promise<AgreementState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { data: group } = await supabase
    .from('hui_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return { error: 'Chỉ chủ hụi mới có thể kích hoạt' };
  }

  // Check: all members signed?
  const { data: members } = await supabase
    .from('hui_members')
    .select('id, status, agreement_signed_at, shares, user_id, payout_order')
    .eq('group_id', groupId)
    .not('status', 'in', '(removed,withdrawn)');

  if (!members) return { error: 'Không tìm thấy thành viên' };

  const unsigned = members.filter((m) => !m.agreement_signed_at);
  if (unsigned.length > 0) {
    return { error: `Còn ${unsigned.length} thành viên chưa ký thỏa thuận` };
  }

  // Check: total shares match
  const totalMemberShares = members.reduce((sum, m) => sum + m.shares, 0);
  if (totalMemberShares < group.total_shares) {
    return { error: `Cần ${group.total_shares} phần, hiện có ${totalMemberShares} phần` };
  }

  // Check: all KYC approved if require_kyc is true
  if (group.require_kyc) {
    const memberUserIds = members.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, kyc_status')
      .in('id', memberUserIds);
      
    if (profiles) {
      const unverified = profiles.filter(p => p.kyc_status !== 'approved');
      if (unverified.length > 0) {
        return { error: `Không thể kích hoạt: Có ${unverified.length} Hụi viên chưa Xác minh danh tính` };
      }
    }
  }
  // Determine payout order (build array of member IDs corresponding to each share)
  const isFixedOrder = group.payout_method === 'fixed_order';
  const payoutQueue: string[] = [];
  if (isFixedOrder) {
    const sortedMembers = [...members].sort((a, b) => (a.payout_order || 999) - (b.payout_order || 999));
    for (const m of sortedMembers) {
      for (let i = 0; i < m.shares; i++) {
        payoutQueue.push(m.id);
      }
    }
  }

  // Calculate cashflow
  const cashflow = calculateCashflow({
    shareValue: group.share_value,
    totalShares: group.total_shares,
    cycleType: group.cycle_type as any,
    startDate: group.start_date,
    commissionType: group.commission_type as any,
    commissionAmount: group.commission_amount || 0,
    huiType: group.hui_type as any,
  });

  // Generate periods
  const periodsToInsert = [];
  for (let i = 0; i < group.total_shares; i++) {
    const row = cashflow.rows[i];
    const graceDeadline = new Date(row.dueDate);
    graceDeadline.setDate(graceDeadline.getDate() + (group.grace_period_days || 3));

    // For draw: first period starts as draw_pending
    // For auction: first period starts as upcoming (auto-open 3d before due or manual)
    // For fixed_order: first period starts as payment_open with assigned payout member
    let firstPeriodStatus = 'draw_pending';
    if (isFixedOrder) firstPeriodStatus = 'payment_open';
    if (group.payout_method === 'auction') firstPeriodStatus = 'upcoming';

    const periodData: any = {
      group_id: groupId,
      period_number: i + 1,
      payment_due_date: row.dueDate,
      grace_deadline: graceDeadline.toISOString().split('T')[0],
      status: i === 0 ? firstPeriodStatus : 'upcoming',
      payout_member_id: isFixedOrder ? (payoutQueue[i] || payoutQueue[0]) : null,
      payout_amount: Number(row.totalCollected),
      commission_amount: Number(row.commissionDeducted),
    };

    periodsToInsert.push(periodData);
  }

  const { error: periodError } = await supabase
    .from('hui_periods')
    .insert(periodsToInsert);

  if (periodError) {
    console.error('Lỗi tạo kỳ:', periodError);
    return { error: `Lỗi tạo kỳ: ${periodError.message}` };
  }

  // For fixed_order: pre-generate all contributions and payouts
  // For draw/auction: contributions are generated after each draw/auction
  if (isFixedOrder) {
    const { data: insertedPeriods } = await supabase
      .from('hui_periods')
      .select('id, period_number, payout_member_id')
      .eq('group_id', groupId);

    const contributionsToInsert = [];
    const payoutsToInsert = [];

    for (const period of insertedPeriods || []) {
      const row = cashflow.rows[period.period_number - 1];
      
      payoutsToInsert.push({
        period_id: period.id,
        recipient_member_id: period.payout_member_id,
        amount: Number(row.totalCollected),
        commission_deducted: Number(row.commissionDeducted),
        net_amount: Number(row.recipientReceives),
        status: 'pending',
      });

      for (const m of members) {
        const receivingSharesThisPeriod = period.payout_member_id === m.id ? 1 : 0;
        const sharesToPay = m.shares - receivingSharesThisPeriod;

        if (sharesToPay > 0) {
          contributionsToInsert.push({
            period_id: period.id,
            member_id: m.id,
            share_number: sharesToPay,
            amount_due: sharesToPay * Number(row.memberPays),
            status: 'pending',
          });
        }
      }
    }

    if (payoutsToInsert.length > 0) {
      const { error: payoutError } = await supabase.from('payouts').insert(payoutsToInsert);
      if (payoutError) {
        console.error('Lỗi tạo giao hụi:', payoutError);
        return { error: `Lỗi tạo giao hụi: ${payoutError.message}` };
      }
    }

    if (contributionsToInsert.length > 0) {
      const { error: contribError } = await supabase.from('contributions').insert(contributionsToInsert);
      if (contribError) {
        console.error('Lỗi tạo đóng tiền:', contribError);
        return { error: `Lỗi tạo đóng tiền: ${contribError.message}` };
      }
    }
  }

  // Update group status
  await supabase
    .from('hui_groups')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
    })
    .eq('id', groupId);

  revalidatePath(`/day-hui/${groupId}`);
  return { success: true };
}
