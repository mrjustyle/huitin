'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type KycState = {
  error?: string;
  success?: boolean;
} | undefined;

export async function submitKyc(prevState: KycState, formData: FormData): Promise<KycState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Chưa đăng nhập' };

  const cccdNumber = formData.get('cccdNumber') as string;
  const cccdFront = formData.get('cccdFront') as File;
  const cccdBack = formData.get('cccdBack') as File;
  const selfie = formData.get('selfie') as File;

  if (!cccdNumber || !cccdFront || !cccdBack || !selfie) {
    return { error: 'Vui lòng điền đầy đủ thông tin và tải ảnh' };
  }

  if (cccdNumber.length !== 12) {
    return { error: 'Số CCCD phải có 12 chữ số' };
  }

  // Hash CCCD number (never store plain text)
  const encoder = new TextEncoder();
  const data = encoder.encode(cccdNumber);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const cccdHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Upload files to private bucket
  const timestamp = Date.now();
  const uploads = [
    { file: cccdFront, path: `${user.id}/cccd-front-${timestamp}` },
    { file: cccdBack, path: `${user.id}/cccd-back-${timestamp}` },
    { file: selfie, path: `${user.id}/selfie-${timestamp}` },
  ];

  const urls: string[] = [];

  for (const { file, path } of uploads) {
    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { error: `Lỗi tải ảnh: ${uploadError.message}` };
    }
    urls.push(path);
  }

  // Insert KYC document
  const { error: insertError } = await supabase
    .from('kyc_documents')
    .upsert({
      user_id: user.id,
      cccd_number_hash: cccdHash,
      cccd_front_url: urls[0],
      cccd_back_url: urls[1],
      selfie_url: urls[2],
    }, {
      onConflict: 'user_id',
    });

  if (insertError) {
    // Check for duplicate CCCD
    if (insertError.message.includes('idx_kyc_cccd_hash')) {
      return { error: 'Số CCCD này đã được đăng ký trên hệ thống' };
    }
    return { error: `Lỗi lưu thông tin: ${insertError.message}` };
  }

  // Update user profile KYC status
  await supabase
    .from('user_profiles')
    .update({
      kyc_status: 'pending',
      kyc_submitted_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  revalidatePath('/kyc');
  revalidatePath('/trang-chu');
  return { success: true };
}

export async function getKycStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('kyc_status, kyc_submitted_at, kyc_approved_at')
    .eq('id', user.id)
    .single();

  return profile;
}
