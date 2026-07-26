'use server';

import { createClient } from '@/lib/supabase/server';

const FREE_GROUP_LIMIT = 1;

export async function getSubscriptionStatus(userId?: string) {
  const supabase = await createClient();
  
  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { plan: 'free' as const, isVip: false, expiresAt: null };
    uid = user.id;
  }

  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan, status, expires_at')
    .eq('user_id', uid)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data || data.plan !== 'vip') {
    return { plan: 'free' as const, isVip: false, expiresAt: null };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Auto-expire
    await supabase
      .from('user_subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', uid)
      .eq('status', 'active');
    return { plan: 'free' as const, isVip: false, expiresAt: data.expires_at };
  }

  return { 
    plan: 'vip' as const, 
    isVip: true, 
    expiresAt: data.expires_at 
  };
}

export async function getActiveGroupCount(userId?: string) {
  const supabase = await createClient();
  
  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    uid = user.id;
  }

  const { count } = await supabase
    .from('hui_groups')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', uid)
    .in('status', ['draft', 'recruiting', 'pending_agreement', 'ready', 'active']);

  return count || 0;
}

export async function canCreateGroup(userId?: string) {
  const sub = await getSubscriptionStatus(userId);
  if (sub.isVip) return { allowed: true, reason: null, activeCount: 0, limit: Infinity };

  const activeCount = await getActiveGroupCount(userId);
  if (activeCount >= FREE_GROUP_LIMIT) {
    return { 
      allowed: false, 
      reason: `Gói Free giới hạn tối đa ${FREE_GROUP_LIMIT} dây hụi đang hoạt động. Nâng cấp VIP để tạo không giới hạn.`,
      activeCount,
      limit: FREE_GROUP_LIMIT 
    };
  }

  return { allowed: true, reason: null, activeCount, limit: FREE_GROUP_LIMIT };
}

export async function togglePrivacyMode(groupId: string, enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Check ownership
  const { data: group } = await supabase
    .from('hui_groups')
    .select('owner_id')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== user.id) return { error: 'Chỉ chủ hụi mới có quyền' };

  // Check VIP
  const sub = await getSubscriptionStatus(user.id);
  if (!sub.isVip) return { error: 'Tính năng này yêu cầu gói VIP. Vui lòng nâng cấp.' };

  const { error } = await supabase
    .from('hui_groups')
    .update({ privacy_mode: enabled })
    .eq('id', groupId);

  if (error) return { error: error.message };
  return { success: true };
}

// Admin: Kích hoạt VIP cho user
export async function activateVip(userId: string, months: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Check admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Không có quyền' };

  // Deactivate old subscriptions
  await supabase
    .from('user_subscriptions')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Create new VIP subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan: 'vip',
      status: 'active',
      expires_at: expiresAt.toISOString(),
    });

  if (error) return { error: error.message };
  return { success: true, expiresAt: expiresAt.toISOString() };
}

// Admin: Hủy VIP
export async function deactivateVip(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Không có quyền' };

  const { error } = await supabase
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) return { error: error.message };
  return { success: true };
}
