'use server';

import { createClient } from '@/lib/supabase/server';

// Helper kiểm tra quyền admin
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập', user: null, supabase: null };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  // Cho phép truy cập nếu user có cờ is_admin HOẶC trong môi trường dev
  if (!profile?.is_admin) {
    return { error: 'Không có quyền Admin', user: null, supabase: null };
  }
  return { error: null, user, supabase };
}

export async function getAdminDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const [
    { count: totalUsers },
    { count: pendingKyc },
    { count: totalGroups },
    { count: activeGroups },
    { count: openDisputes },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
    supabase.from('hui_groups').select('*', { count: 'exact', head: true }),
    supabase.from('hui_groups').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  // Tổng giá trị vòng hụi đang hoạt động
  const { data: groups } = await supabase
    .from('hui_groups')
    .select('share_value, total_shares')
    .eq('status', 'active');

  const totalActiveValue = (groups || []).reduce(
    (sum: number, g: any) => sum + g.share_value * g.total_shares, 0
  );

  return {
    totalUsers: totalUsers || 0,
    pendingKyc: pendingKyc || 0,
    totalGroups: totalGroups || 0,
    activeGroups: activeGroups || 0,
    openDisputes: openDisputes || 0,
    totalActiveValue,
  };
}

export async function adminSearchUsers(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let queryBuilder = supabase
    .from('user_profiles')
    .select('id, full_name, phone, kyc_status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (query && query.trim() !== '') {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('[adminSearchUsers] profiles error:', error.message);
  }

  if (!data || data.length === 0) return [];

  // Fetch subscription status + dates for each user
  const userIds = data.map((u: any) => u.id);
  const { data: subs, error: subError } = await supabase
    .from('user_subscriptions')
    .select('user_id, plan, started_at, expires_at')
    .in('user_id', userIds)
    .eq('status', 'active');

  if (subError) {
    console.error('[adminSearchUsers] subs error:', subError.message);
  }

  const subMap: Record<string, any> = {};
  (subs || []).forEach((s: any) => { subMap[s.user_id] = s; });

  return data.map((u: any) => ({
    ...u,
    subscription_plan: subMap[u.id]?.plan || 'free',
    vip_started_at: subMap[u.id]?.started_at || null,
    vip_expires_at: subMap[u.id]?.expires_at || null,
  }));
}

export async function adminSearchGroups(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('hui_groups')
    .select('id, name, status, hui_type, share_value, total_shares, created_at, owner_id')
    .ilike('name', `%${query}%`)
    .limit(20);

  return data || [];
}

export async function getAuditLog(limit = 50, offset = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Admin getAuditLog] Error:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Look up actor names
  const actorIds = [...new Set(data.map((e: any) => e.actor_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', actorIds);

  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p.full_name; });

  return data.map((e: any) => ({
    ...e,
    actor: { full_name: profileMap[e.actor_id] || 'System' },
  }));
}

export async function getOpenDisputes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Query disputes without the reporter join (reporter_id FK → auth.users, not user_profiles)
  const { data, error } = await supabase
    .from('disputes')
    .select('*, period:hui_periods!period_id(period_number), group:hui_groups!group_id(name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Admin getOpenDisputes] Error:', error.message, error.details, error.hint);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Look up reporter names from user_profiles
  const reporterIds = [...new Set(data.map((d: any) => d.reporter_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', reporterIds);

  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p.full_name; });

  return data.map((d: any) => ({
    ...d,
    reporter: { full_name: profileMap[d.reporter_id] || 'Không rõ' },
  }));
}

export async function adminResolveDispute(disputeId: string, periodId: string, note: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { error: e1 } = await supabase
    .from('disputes')
    .update({ status: 'resolved', admin_note: note, updated_at: new Date().toISOString() })
    .eq('id', disputeId);
  if (e1) return { error: e1.message };

  await supabase
    .from('hui_periods')
    .update({ status: 'active' })
    .eq('id', periodId)
    .eq('status', 'disputed');

  return { success: true };
}
