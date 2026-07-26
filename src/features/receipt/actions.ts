'use server';

import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

export type LedgerTransaction = {
  id: string; // contribution_id or payout_id
  type: 'contribution' | 'payout';
  periodNumber: number;
  memberName: string;
  amount: number;
  date: string;
  status: string;
  receiptId?: string; // If receipt generated
};

export async function getLedgerData(groupId: string): Promise<LedgerTransaction[]> {
  const supabase = await createClient();
  
  // 1. Lấy tất cả kỳ hụi của dây
  const { data: periods, error: periodsError } = await supabase
    .from('hui_periods')
    .select('id, period_number')
    .eq('group_id', groupId);
    
  if (periodsError || !periods) return [];
  
  const periodIds = periods.map(p => p.id);
  if (periodIds.length === 0) return [];

  // 2. Lấy danh sách đóng hụi (Contributions)
  const { data: contributions } = await (supabase
    .from('contributions')
    .select(`
      id,
      amount_due,
      amount_paid,
      evidence_uploaded_at,
      period_id,
      hui_members!inner (
        id,
        user_profiles!inner ( full_name )
      )
    `)
    .in('period_id', periodIds) as any);
    
  // 3. Lấy danh sách lĩnh hụi (Payouts)
  const { data: payouts } = await (supabase
    .from('payouts')
    .select(`
      id,
      net_amount,
      recipient_confirmed_at,
      recipient_confirmed,
      period_id,
      hui_members!inner (
        id,
        user_profiles!inner ( full_name )
      )
    `)
    .in('period_id', periodIds) as any);
    
  // 4. Map vào Ledger format
  const ledger: LedgerTransaction[] = [];
  
  const periodMap = new Map<string, number>();
  periods.forEach(p => periodMap.set(p.id, p.period_number));
  
  if (contributions) {
    contributions.forEach((c: any) => {
      // Chỉ tính các giao dịch đã đóng tiền (amount_paid > 0)
      if (c.amount_paid > 0) {
        ledger.push({
          id: c.id,
          type: 'contribution',
          periodNumber: periodMap.get(c.period_id) || 0,
          memberName: c.hui_members?.user_profiles?.full_name || 'Không xác định',
          amount: c.amount_paid,
          date: c.evidence_uploaded_at || new Date().toISOString(),
          status: c.amount_paid >= c.amount_due ? 'Đã đóng' : 'Thiếu',
        });
      }
    });
  }
  
  if (payouts) {
    payouts.forEach((p: any) => {
      // Chỉ tính các giao dịch đã xác nhận
      if (p.recipient_confirmed) {
        ledger.push({
          id: p.id,
          type: 'payout',
          periodNumber: periodMap.get(p.period_id) || 0,
          memberName: p.hui_members?.user_profiles?.full_name || 'Không xác định',
          amount: p.net_amount,
          date: p.recipient_confirmed_at || new Date().toISOString(),
          status: 'Đã nhận',
        });
      }
    });
  }
  
  // Sắp xếp theo thứ tự thời gian (mới nhất trước)
  ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return ledger;
}

export type MatrixLedgerData = {
  members: { id: string; name: string; shares: number }[];
  periods: { id: string; number: number; payout_member_id: string | null; status: string }[];
  contributions: Record<string, Record<string, { amount: number; status: string }>>; // memberId -> periodId -> { amount, status }
  payouts: Record<string, Record<string, { amount: number; status: string }>>; // memberId -> periodId -> { amount, status }
};

export async function getMatrixLedgerData(groupId: string): Promise<MatrixLedgerData> {
  const supabase = await createClient();
  
  // 1. Get Members
  const { data: membersRaw } = await supabase
    .from('hui_members')
    .select('id, user_id, shares')
    .eq('group_id', groupId)
    .neq('status', 'removed')
    .neq('status', 'withdrawn');
    
  const memberUserIds = (membersRaw || []).map((m: any) => m.user_id);
  let profiles: Record<string, string> = {};
  
  if (memberUserIds.length > 0) {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', memberUserIds);
      
    if (profileData) {
      profiles = Object.fromEntries(profileData.map((p) => [p.id, p.full_name]));
    }
  }

  const members = (membersRaw || []).map((m: any) => ({
    id: m.id,
    name: profiles[m.user_id] || 'Unknown',
    shares: m.shares,
  }));

  // 2. Get Periods
  const { data: periodsRaw } = await supabase
    .from('hui_periods')
    .select('id, period_number, payout_member_id, status')
    .eq('group_id', groupId)
    .order('period_number', { ascending: true });
    
  const periods = (periodsRaw || []).map((p: any) => ({
    id: p.id,
    number: p.period_number,
    payout_member_id: p.payout_member_id,
    status: p.status,
  }));
  const periodIds = periods.map(p => p.id);

  // 3. Get Contributions
  const contributions: Record<string, Record<string, { amount: number; status: string }>> = {};
  members.forEach(m => { contributions[m.id] = {}; });
  
  if (periodIds.length > 0) {
    const { data: contribsRaw } = await supabase
      .from('contributions')
      .select('member_id, period_id, amount_due, status')
      .in('period_id', periodIds);
      
    (contribsRaw || []).forEach(c => {
      if (!contributions[c.member_id]) contributions[c.member_id] = {};
      contributions[c.member_id][c.period_id] = {
        amount: c.amount_due,
        status: c.status,
      };
    });
  }

  // 4. Get Payouts
  const payouts: Record<string, Record<string, { amount: number; status: string }>> = {};
  members.forEach(m => { payouts[m.id] = {}; });
  
  if (periodIds.length > 0) {
    const { data: payoutsRaw } = await supabase
      .from('payouts')
      .select('recipient_member_id, period_id, net_amount, status')
      .in('period_id', periodIds);
      
    (payoutsRaw || []).forEach(p => {
      if (!payouts[p.recipient_member_id]) payouts[p.recipient_member_id] = {};
      payouts[p.recipient_member_id][p.period_id] = {
        amount: p.net_amount,
        status: p.status,
      };
    });
  }

  return {
    members,
    periods,
    contributions,
    payouts,
  };
}

export async function getReceipts(groupId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      id,
      transaction_type,
      amount,
      checksum,
      created_at,
      hui_periods ( period_number ),
      hui_members ( user_profiles!hui_members_user_id_fkey ( full_name ) )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching receipts:', error);
    return [];
  }
  
  return data.map((r: any) => ({
    id: r.id,
    type: r.transaction_type,
    amount: r.amount,
    checksum: r.checksum,
    createdAt: r.created_at,
    periodNumber: r.hui_periods?.period_number,
    memberName: r.hui_members?.user_profiles?.full_name || 'Không rõ',
  }));
}
