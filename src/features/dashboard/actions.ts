'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  totalContributed: number;      // Tổng tiền đã đóng
  totalReceived: number;         // Tổng tiền đã nhận
  activeGroups: number;          // Dây hụi đang hoạt động
  completedPeriods: number;      // Số kỳ đã hoàn thành
  cashflowByMonth: { month: string; contributed: number; received: number }[];
  groupBreakdown: { name: string; value: number; status: string }[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  // Get user's member IDs
  const { data: memberships } = await supabase
    .from('hui_members')
    .select('id, group_id, role')
    .eq('user_id', userId)
    .not('status', 'in', '(removed,withdrawn)');

  const memberIds = (memberships || []).map(m => m.id);
  const groupIds = (memberships || []).map(m => m.group_id);

  if (memberIds.length === 0) {
    return {
      totalContributed: 0,
      totalReceived: 0,
      activeGroups: 0,
      completedPeriods: 0,
      cashflowByMonth: [],
      groupBreakdown: [],
    };
  }

  // Fetch confirmed contributions
  const { data: contributions } = await supabase
    .from('contributions')
    .select('amount_due, confirmed_at, period_id')
    .in('member_id', memberIds)
    .eq('status', 'confirmed');

  // Fetch confirmed payouts (user received money)
  const { data: payoutPeriods } = await supabase
    .from('hui_periods')
    .select('payout_amount, commission_amount, completed_at, period_number')
    .in('payout_member_id', memberIds)
    .eq('status', 'completed');

  // Fetch groups
  const { data: groups } = await supabase
    .from('hui_groups')
    .select('id, name, share_value, total_shares, status, hui_periods(status)')
    .in('id', groupIds);

  // Calculate totals
  const totalContributed = (contributions || []).reduce((s, c) => s + (c.amount_due || 0), 0);
  const totalReceived = (payoutPeriods || []).reduce((s, p) => s + ((p.payout_amount || 0) - (p.commission_amount || 0)), 0);
  const activeGroups = (groups || []).filter(g => g.status === 'active').length;
  const completedPeriods = (payoutPeriods || []).length;

  // Build cashflow by month (last 6 months)
  const monthMap = new Map<string, { contributed: number; received: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `T${d.getMonth() + 1}`;
    monthMap.set(key, { contributed: 0, received: 0 });
  }

  for (const c of contributions || []) {
    if (c.confirmed_at) {
      const d = new Date(c.confirmed_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key);
      if (entry) entry.contributed += c.amount_due || 0;
    }
  }

  for (const p of payoutPeriods || []) {
    if (p.completed_at) {
      const d = new Date(p.completed_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key);
      if (entry) entry.received += (p.payout_amount || 0) - (p.commission_amount || 0);
    }
  }

  const cashflowByMonth = Array.from(monthMap.entries()).map(([key, val]) => {
    const [y, m] = key.split('-');
    return { month: `T${parseInt(m)}`, ...val };
  });

  // Group breakdown for pie chart
  const groupBreakdown = (groups || []).map(g => ({
    name: g.name,
    value: (g.share_value || 0) * (g.total_shares || 0),
    status: g.status,
  }));

  return {
    totalContributed,
    totalReceived,
    activeGroups,
    completedPeriods,
    cashflowByMonth,
    groupBreakdown,
  };
}
