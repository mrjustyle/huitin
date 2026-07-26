'use server';

import { createClient } from '@/lib/supabase/server';

export async function getRiskSignals(resolved = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const query = supabase
    .from('risk_signals')
    .select('*')
    .eq('is_resolved', resolved)
    .order('created_at', { ascending: false })
    .limit(100);

  const { data, error } = await query;
  if (error) {
    console.error('[getRiskSignals]', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Enrich with user/group names
  const userIds = [...new Set(data.map((r: any) => r.user_id).filter(Boolean))];
  const groupIds = [...new Set(data.map((r: any) => r.group_id).filter(Boolean))];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', userIds.length > 0 ? userIds : ['__none__']);

  const { data: groups } = await supabase
    .from('hui_groups')
    .select('id, name')
    .in('id', groupIds.length > 0 ? groupIds : ['__none__']);

  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p.full_name; });

  const groupMap: Record<string, string> = {};
  (groups || []).forEach((g: any) => { groupMap[g.id] = g.name; });

  return data.map((r: any) => ({
    ...r,
    userName: profileMap[r.user_id] || 'N/A',
    groupName: groupMap[r.group_id] || 'N/A',
  }));
}

export async function resolveRiskSignal(signalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { error } = await supabase
    .from('risk_signals')
    .update({
      is_resolved: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', signalId);

  if (error) return { error: error.message };
  return { success: true };
}
