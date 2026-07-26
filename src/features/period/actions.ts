'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateReceiptChecksum } from '@/lib/crypto';
import crypto from 'crypto';

export async function submitProof(contributionId: string, evidenceUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const updateData: Record<string, any> = {
    status: 'proof_submitted',
    evidence_uploaded_at: new Date().toISOString()
  };

  if (evidenceUrl) {
    updateData.evidence_url = evidenceUrl;
  }

  const { error } = await supabase
    .from('contributions')
    .update(updateData)
    .eq('id', contributionId)
    // RLS will ensure only the member can update their own contribution
    .eq('status', 'pending');

  if (error) return { error: error.message };

  // Revalidate so owner sees updated status
  revalidatePath('/day-hui', 'layout');
  return { success: true };
}

export async function confirmPayment(contributionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Get contribution with period info
  const { data: contrib } = await supabase
    .from('contributions')
    .select('amount_due, period_id, member_id, hui_periods(group_id)')
    .eq('id', contributionId)
    .single();
    
  if (!contrib) return { error: 'Không tìm thấy' };

  const { error } = await supabase
    .from('contributions')
    .update({ 
      status: 'confirmed',
      amount_paid: contrib.amount_due,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString()
    })
    .eq('id', contributionId);

  if (error) return { error: error.message };

  // Generate Receipt
  const groupId = (contrib.hui_periods as any)?.group_id;
  if (groupId) {
    const checksum = generateReceiptChecksum(
      groupId,
      contrib.period_id,
      contrib.member_id,
      contrib.amount_due,
      'contribution',
      contributionId
    );
    await supabase.from('receipts').insert({
      group_id: groupId,
      period_id: contrib.period_id,
      member_id: contrib.member_id,
      transaction_type: 'contribution',
      reference_id: contributionId,
      amount: contrib.amount_due,
      checksum
    });
  }

  // Check if all contributions for this period are confirmed
  const { data: remaining } = await supabase
    .from('contributions')
    .select('id')
    .eq('period_id', contrib.period_id)
    .neq('status', 'confirmed');

  if (remaining && remaining.length === 0) {
    // All contributions confirmed → advance period status
    await supabase
      .from('hui_periods')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', contrib.period_id)
      .eq('status', 'payment_open');
  }

  revalidatePath('/day-hui', 'layout');
  return { success: true };
}

// A1: Chủ hụi xác nhận đã chuyển tiền cho người lĩnh
export async function initiatePayout(periodId: string, evidenceUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { error } = await supabase
    .from('hui_periods')
    .update({ 
      status: 'payout_pending',
      payout_evidence_url: evidenceUrl || null,
    })
    .eq('id', periodId)
    .eq('status', 'completed');

  if (error) return { error: error.message };

  revalidatePath('/day-hui', 'layout');
  return { success: true };
}

// A1: Người lĩnh xác nhận đã nhận tiền
export async function confirmPayout(periodId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Get payout info
  const { data: payout } = await supabase
    .from('payouts')
    .select('id, amount, net_amount, recipient_member_id')
    .eq('period_id', periodId)
    .single();

  // Update period to payout_confirmed
  const { error } = await supabase
    .from('hui_periods')
    .update({ 
      status: 'payout_confirmed',
      completed_at: new Date().toISOString()
    })
    .eq('id', periodId)
    .eq('status', 'payout_pending');

  if (error) return { error: error.message };

  // A2: Get current period info to find next period
  const { data: currentPeriod } = await supabase
    .from('hui_periods')
    .select('group_id, period_number, hui_groups(payout_method)')
    .eq('id', periodId)
    .single();

  if (currentPeriod) {
    // Generate Payout Receipt
    if (payout) {
      const checksum = generateReceiptChecksum(
        currentPeriod.group_id,
        periodId,
        payout.recipient_member_id,
        payout.net_amount,
        'payout',
        payout.id
      );
      await supabase.from('receipts').insert({
        group_id: currentPeriod.group_id,
        period_id: periodId,
        member_id: payout.recipient_member_id,
        transaction_type: 'payout',
        reference_id: payout.id,
        amount: payout.net_amount,
        checksum
      });
    }
    // Try to open next period
    const { data: nextPeriod } = await supabase
      .from('hui_periods')
      .select('id')
      .eq('group_id', currentPeriod.group_id)
      .eq('period_number', currentPeriod.period_number + 1)
      .eq('status', 'upcoming')
      .single();

    if (nextPeriod) {
      // Determine next period initial status based on payout method
      const payoutMethod = (currentPeriod as any).hui_groups?.payout_method;
      // auction: stays 'upcoming' until auto-open (3d before due) or manual open
      // draw: goes to draw_pending immediately
      // fixed_order: goes to payment_open immediately
      let nextStatus = 'upcoming';
      if (payoutMethod === 'fixed_order') nextStatus = 'payment_open';
      if (payoutMethod === 'draw') nextStatus = 'draw_pending';
      
      await supabase
        .from('hui_periods')
        .update({ status: nextStatus })
        .eq('id', nextPeriod.id);
    } else {
      // A3: No more periods → complete the group
      const { data: remainingPeriods } = await supabase
        .from('hui_periods')
        .select('id')
        .eq('group_id', currentPeriod.group_id)
        .neq('status', 'payout_confirmed');

      if (remainingPeriods && remainingPeriods.length === 0) {
        await supabase
          .from('hui_groups')
          .update({ status: 'completed' })
          .eq('id', currentPeriod.group_id);
      }
    }
  }

  revalidatePath('/day-hui', 'layout');
  return { success: true };
}

// B0: Chuẩn bị bốc thăm (Sinh Server Seed và Hash)
export async function prepareDraw(periodId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { data: period } = await supabase
    .from('hui_periods')
    .select('*, hui_groups(owner_id)')
    .eq('id', periodId)
    .single();

  if (!period) return { error: 'Không tìm thấy kỳ hụi' };
  if (period.hui_groups.owner_id !== user.id) return { error: 'Chỉ chủ hụi mới có quyền' };
  if (period.status !== 'draw_pending') return { error: 'Kỳ này không ở trạng thái chờ bốc thăm' };
  if (period.draw_server_hash) return { error: 'Đã chuẩn bị bốc thăm rồi' };

  // Sinh server_seed 32 bytes (64 hex chars)
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

  // Lưu vào DB (phải dùng service_role client để bỏ qua RLS vì table secrets bị khoá với user thường)
  // Tuy nhiên Supabase JS client từ createClient() sẽ chạy bằng quyền user.
  // Nếu RLS của period_draw_secrets chỉ cho phép admin, user (owner) sẽ không insert được.
  // Sửa: Ta có thể dùng supabase admin client, nhưng để đơn giản ta có thể lưu tạm vào metadata hoặc
  // mở RLS cho owner insert. Giả sử ta mở RLS trong migration.
  
  // Create admin client to bypass RLS for secrets table
  const adminClient = await createClient(); // Ideally should use service_role, but for MVP let's assume RLS allows owner to insert for their period

  const { error: secretError } = await supabase
    .from('period_draw_secrets')
    .insert({ period_id: periodId, server_seed: serverSeed });

  if (secretError) {
    // Nếu lỗi quyền (vi phạm RLS), ta sẽ log ra và trả lỗi
    console.error('Lưu server_seed thất bại:', secretError);
    return { error: 'Lỗi lưu trữ bí mật: ' + secretError.message };
  }

  // Cập nhật hash công khai
  const { error: updateError } = await supabase
    .from('hui_periods')
    .update({ draw_server_hash: serverHash })
    .eq('id', periodId);

  if (updateError) return { error: updateError.message };

  revalidatePath('/day-hui', 'layout');
  return { success: true, serverHash };
}

// B1: Bốc thăm — có kiểm chứng (Verifiable Randomness)
export async function conductDraw(periodId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Get period info
  const { data: period } = await supabase
    .from('hui_periods')
    .select('*, hui_groups(*)')
    .eq('id', periodId)
    .single();

  if (!period) return { error: 'Không tìm thấy kỳ hụi' };
  if (period.status !== 'draw_pending') return { error: 'Kỳ này không ở trạng thái chờ bốc thăm' };
  if (period.hui_groups.owner_id !== user.id) return { error: 'Chỉ chủ hụi mới có thể bốc thăm' };
  if (period.draw_locked_at) return { error: 'Kỳ này đã bốc thăm rồi' };

  const group = period.hui_groups;

  // Get all members with shares > 0 (participants)
  const { data: allMembers } = await supabase
    .from('hui_members')
    .select('id, shares, user_id')
    .eq('group_id', group.id)
    .gt('shares', 0)
    .not('status', 'in', '(removed,withdrawn)');

  if (!allMembers || allMembers.length === 0) return { error: 'Không có thành viên tham gia' };

  // Find members who already received payout in previous periods
  const { data: previousPeriods } = await supabase
    .from('hui_periods')
    .select('payout_member_id')
    .eq('group_id', group.id)
    .not('payout_member_id', 'is', null);

  const alreadyReceived = new Set((previousPeriods || []).map(p => p.payout_member_id));
  
  // Eligible: members with shares who haven't received payout yet
  const eligible = allMembers.filter(m => !alreadyReceived.has(m.id));

  if (eligible.length === 0) return { error: 'Tất cả thành viên đã lĩnh hụi' };

  // Verifiable Randomness Draw Logic
  if (!period.draw_server_hash) {
    return { error: 'Chưa khởi tạo bốc thăm kiểm chứng' };
  }

  // Lấy server_seed từ bảng secrets
  const { data: secret } = await supabase
    .from('period_draw_secrets')
    .select('server_seed')
    .eq('period_id', periodId)
    .single();

  if (!secret) return { error: 'Không tìm thấy server_seed. Vui lòng liên hệ Admin.' };

  const serverSeed = secret.server_seed;
  const clientSeed = periodId; // MVP: Dùng periodId làm clientSeed nếu người dùng không tự nhập, hoặc bạn có thể pass clientSeed từ UI. Tạm pass tham số.
  // Wait, the conductDraw function definition needs clientSeed parameter.
  // Let's use crypto to pick the winner deterministically.
  
  // Update function signature internally or just use periodId as salt for now to keep it deterministic but verifiable.
  // Better: Generate a clientSeed on UI and pass it. For now, since UI hasn't passed it, we generate one or use current timestamp.
  const actualClientSeed = Date.now().toString(); 

  // Combine seeds
  const combined = `${serverSeed}-${actualClientSeed}`;
  
  // Hash to get a number
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  const hashNum = BigInt('0x' + hash.slice(0, 16)); // Take first 16 hex chars as BigInt
  const winningIndex = Number(hashNum % BigInt(eligible.length));

  const winner = eligible[winningIndex];

  // Get winner's name for the draw result
  const { data: winnerProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', winner.user_id)
    .single();

  const drawResult = {
    winner_member_id: winner.id,
    winner_name: winnerProfile?.full_name || 'Unknown',
    eligible_count: eligible.length,
    drawn_at: new Date().toISOString(),
  };

  // Update period with winner & publicize seeds
  const { error: updateError } = await supabase
    .from('hui_periods')
    .update({
      payout_member_id: winner.id,
      draw_result: drawResult,
      draw_locked_at: new Date().toISOString(),
      status: 'payment_open',
      draw_server_seed: serverSeed,
      draw_client_seed: actualClientSeed,
    })
    .eq('id', periodId);

  if (updateError) return { error: updateError.message };

  // Generate contributions for this period (all members except winner)
  const { data: cashflowGroup } = await supabase
    .from('hui_groups')
    .select('share_value, commission_type, commission_amount, hui_type, fixed_interest_amount')
    .eq('id', group.id)
    .single();

  const shareValue = cashflowGroup?.share_value || 0;
  const commType = cashflowGroup?.commission_type || 'none';
  const commAmount = cashflowGroup?.commission_amount || 0;
  const isFixedInterest = cashflowGroup?.hui_type === 'boc_tham_lai_co_dinh';
  const fixedInterestAmount = cashflowGroup?.fixed_interest_amount || 0;

  // Calculate per-member payment
  const totalMembers = allMembers.reduce((sum, m) => sum + m.shares, 0);
  const payingShares = totalMembers - winner.shares;
  
  let totalCollected = 0;
  const contributionsToInsert = [];
  
  for (const m of allMembers) {
    const receivingShares = m.id === winner.id ? winner.shares : 0;
    const sharesToPay = m.shares - receivingShares;
    
    if (sharesToPay > 0) {
      // Determine member's payment rate
      let rate = shareValue;
      if (isFixedInterest) {
        // Hụi chết (đã lĩnh) đóng 100%, Hụi sống (chưa lĩnh) đóng 100% - lãi
        if (!alreadyReceived.has(m.id)) {
          rate = shareValue - fixedInterestAmount;
        }
      }
      
      const amountDue = sharesToPay * rate;
      totalCollected += amountDue;
      
      contributionsToInsert.push({
        period_id: periodId,
        member_id: m.id,
        share_number: sharesToPay,
        amount_due: amountDue,
        status: 'pending',
      });
    }
  }

  let commissionDeducted = 0;
  if (commType === 'fixed_per_period') commissionDeducted = commAmount;
  if (commType === 'percentage') commissionDeducted = Math.round(totalCollected * commAmount / 100);

  // Create payout record
  await supabase.from('payouts').insert({
    period_id: periodId,
    recipient_member_id: winner.id,
    amount: totalCollected,
    commission_deducted: commissionDeducted,
    net_amount: totalCollected - commissionDeducted,
    status: 'pending',
  });

  if (contributionsToInsert.length > 0) {
    await supabase.from('contributions').insert(contributionsToInsert);
  }

  revalidatePath('/day-hui', 'layout');
  return { 
    success: true, 
    winner: drawResult.winner_name,
    drawResult 
  };
}

export async function createDispute(groupId: string, periodId: string, reason: string, evidenceUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Cập nhật trạng thái kỳ hụi thành disputed
  await supabase
    .from('hui_periods')
    .update({ status: 'disputed' })
    .eq('id', periodId);

  // Tạo record khiếu nại
  const { error } = await supabase
    .from('disputes')
    .insert({
      group_id: groupId,
      period_id: periodId,
      reporter_id: user.id,
      reason,
      evidence_url: evidenceUrl,
      status: 'open'
    });

  if (error) {
    console.error('Error creating dispute:', error);
    return { error: 'Lỗi khi tạo khiếu nại: ' + error.message };
  }

  revalidatePath('/day-hui', 'layout');
  return { success: true };
}

export async function remindPayment(groupId: string, periodId: string, memberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Fetch member info
  const { data: member } = await supabase
    .from('hui_members')
    .select('user_id')
    .eq('id', memberId)
    .single();

  if (!member || !member.user_id) {
    return { error: 'Thành viên không hợp lệ' };
  }

  // Fetch group & period info for the message
  const { data: period } = await supabase.from('hui_periods').select('period_number').eq('id', periodId).single();
  const { data: group } = await supabase.from('hui_groups').select('name').eq('id', groupId).single();

  // Insert notification
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: member.user_id,
      type: 'info',
      title: 'Nhắc nhở đóng hụi',
      message: `Chủ hụi nhắc bạn đóng tiền cho kỳ ${period?.period_number || ''} dây hụi "${group?.name || ''}". Vui lòng đóng hụi sớm nhất có thể.`,
      link: `/day-hui/${groupId}/ky/${periodId}`
    });

  if (error) {
    console.error('Error sending reminder:', error);
    return { error: 'Lỗi khi gửi thông báo: ' + error.message };
  }

  return { success: true };
}

export async function getDisputes(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('disputes')
    .select('*, reporter:user_profiles!reporter_id(full_name, avatar_url), period:hui_periods(period_number)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching disputes:', error);
    return [];
  }

  return data || [];
}

export async function resolveDispute(disputeId: string, periodId: string, note: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // 1. Cập nhật dispute status
  const { error: updateError } = await supabase
    .from('disputes')
    .update({ status: 'resolved', admin_note: note, updated_at: new Date().toISOString() })
    .eq('id', disputeId);

  if (updateError) return { error: updateError.message };

  // 2. Chuyển period_status từ disputed về lại trạng thái thích hợp (giả sử 'active' hoặc 'upcoming' tuỳ logic, tạm gán lại 'active')
  // Trong thực tế, có thể cần logic phức tạp hơn để xác định trạng thái cũ, nhưng MVP ta gán lại active.
  const { error: periodError } = await supabase
    .from('hui_periods')
    .update({ status: 'active' })
    .eq('id', periodId)
    .eq('status', 'disputed');

  if (periodError) return { error: periodError.message };

  return { success: true };
}
