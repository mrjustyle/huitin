'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ProfileState = {
  error?: string;
  success?: boolean;
} | undefined;

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Chưa đăng nhập' };

  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const dateOfBirth = formData.get('dateOfBirth') as string;
  const address = formData.get('address') as string;

  if (!fullName) {
    return { error: 'Họ và tên không được để trống' };
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      address: address || null,
    })
    .eq('id', user.id);

  if (error) {
    if (error.message.includes('user_profiles_phone_key')) {
      return { error: 'Số điện thoại này đã được đăng ký' };
    }
    return { error: error.message };
  }

  // Also update auth metadata
  await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  revalidatePath('/tai-khoan');
  return { success: true };
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

// --- Bank Account Actions ---

export type BankState = {
  error?: string;
  success?: boolean;
} | undefined;

export async function addBankAccount(prevState: BankState, formData: FormData): Promise<BankState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Chưa đăng nhập' };

  const bankBin = formData.get('bankBin') as string;
  const bankName = formData.get('bankName') as string;
  const accountNumber = formData.get('accountNumber') as string;
  const accountName = formData.get('accountName') as string;

  if (!bankBin || !bankName || !accountNumber || !accountName) {
    return { error: 'Vui lòng điền đầy đủ thông tin' };
  }

  // Check existing accounts count
  const { count } = await supabase
    .from('bank_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const isPrimary = (count ?? 0) === 0;
  const last4 = accountNumber.slice(-4);

  const { error } = await supabase
    .from('bank_accounts')
    .insert({
      user_id: user.id,
      bank_bin: bankBin,
      bank_name: bankName,
      account_number_encrypted: accountNumber, // TODO: encrypt client-side
      account_number_last4: last4,
      account_name: accountName.toUpperCase(),
      is_primary: isPrimary,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/tai-khoan');
  return { success: true };
}

export async function deleteBankAccount(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', user.id);

  revalidatePath('/tai-khoan');
}

export async function setPrimaryBank(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Unset all primary
  await supabase
    .from('bank_accounts')
    .update({ is_primary: false })
    .eq('user_id', user.id);

  // Set new primary
  await supabase
    .from('bank_accounts')
    .update({ is_primary: true })
    .eq('id', accountId)
    .eq('user_id', user.id);

  revalidatePath('/tai-khoan');
}

export async function getBankAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  return data || [];
}

import crypto from 'crypto';

export async function submitKYC({
  cccdNumber,
  frontPath,
  backPath,
  selfiePath
}: {
  cccdNumber: string;
  frontPath: string;
  backPath: string;
  selfiePath: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Chưa đăng nhập' };

  // Hash CCCD
  const cccdHash = crypto.createHash('sha256').update(cccdNumber).digest('hex');

  // Insert into kyc_documents
  const { error: insertError } = await supabase
    .from('kyc_documents')
    .insert({
      user_id: user.id,
      cccd_number_hash: cccdHash,
      cccd_front_url: frontPath,
      cccd_back_url: backPath,
      selfie_url: selfiePath
    });

  if (insertError) {
    if (insertError.message.includes('kyc_documents_cccd_number_hash_key')) {
      return { error: 'Số CCCD này đã được sử dụng ở một tài khoản khác.' };
    }
    return { error: insertError.message };
  }

  // Update profile status to pending
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ kyc_status: 'pending' })
    .eq('id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/tai-khoan');
  return { success: true };
}
