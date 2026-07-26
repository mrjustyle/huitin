'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getPendingKycList() {
  const supabase = await createClient();
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Chưa đăng nhập' };
  
  // Note: For MVP testing, we allow any logged-in user to see this hidden page.
  // In production, we MUST check if (user.role === 'admin').

  // Query pending profiles
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      phone,
      kyc_submitted_at,
      kyc_documents (
        cccd_front_url,
        cccd_back_url,
        selfie_url
      )
    `)
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  // Generate signed URLs for each user's KYC documents
  const usersWithUrls = await Promise.all(
    (data || []).map(async (user: any) => {
      const docs = user.kyc_documents;
      if (!docs) return { ...user, imageUrls: null };

      const paths = [docs.cccd_front_url, docs.cccd_back_url, docs.selfie_url].filter(Boolean);
      const { data: signedUrls } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrls(paths, 3600); // 1 hour expiry

      const urlMap: Record<string, string> = {};
      signedUrls?.forEach((item: any) => {
        if (item.signedUrl) {
          if (item.path?.includes('cccd-front')) urlMap.cccdFront = item.signedUrl;
          else if (item.path?.includes('cccd-back')) urlMap.cccdBack = item.signedUrl;
          else if (item.path?.includes('selfie')) urlMap.selfie = item.signedUrl;
        }
      });

      return { ...user, imageUrls: urlMap };
    })
  );

  return { data: usersWithUrls, error: null };
}

export async function processKycRequest(targetUserId: string, action: 'approve' | 'reject') {
  const supabase = await createClient();
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Call the Security Definer RPC function
  const { error } = await supabase.rpc('admin_update_kyc_status', {
    target_user_id: targetUserId,
    new_status: newStatus
  });

  if (error) {
    console.error('[Admin KYC Error]', error);
    return { error: 'Lỗi cập nhật trạng thái: ' + error.message };
  }

  revalidatePath('/admin-kyc');
  return { success: true };
}
