'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type AuthState = {
  error?: string;
  success?: boolean;
} | undefined;

export async function sendPhoneOTP(phone: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    console.error('Send OTP Error:', error);
    throw new Error(error.message || 'Không thể gửi mã OTP, vui lòng kiểm tra lại số điện thoại.');
  }
  return true;
}

export async function verifyPhoneOTP(phone: string, otp: string) {
  const supabase = await createClient();
  const { error, data } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms',
  });

  if (error) {
    console.error('Verify OTP Error:', error);
    throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
  }
  return data;
}

export async function setPhonePin(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const rawPassword = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!rawPassword) {
    return { error: 'Vui lòng nhập Mã PIN' };
  }

  if (rawPassword.length < 6) {
    return { error: 'Mã PIN phải có đủ 6 số' };
  }

  const password = rawPassword + 'Huitin@2026';
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
    data: fullName ? { full_name: fullName } : undefined,
  });

  if (error) {
    console.error('Set PIN Error:', error);
    return { error: 'Không thể thiết lập Mã PIN, vui lòng thử lại.' };
  }

  return { success: true };
}

export async function signInWithPhonePin(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const phone = formData.get('phone') as string;
  const rawPassword = formData.get('password') as string;

  if (!phone || !rawPassword) {
    return { error: 'Vui lòng nhập số điện thoại và Mã PIN' };
  }

  const password = rawPassword.length === 6 ? rawPassword + 'Huitin@2026' : rawPassword;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    phone,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Số điện thoại hoặc Mã PIN không đúng' };
    }
    return { error: error.message };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  redirect(`${baseUrl}/trang-chu`);
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const rawPassword = formData.get('password') as string;

  if (!email || !rawPassword) {
    return { error: 'Vui lòng nhập email và mật khẩu' };
  }

  const password = rawPassword.length === 6 ? rawPassword + 'Huitin@2026' : rawPassword; // support both PIN and legacy full passwords

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email hoặc mật khẩu không đúng' };
    }
    return { error: error.message };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  redirect(`${baseUrl}/trang-chu`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  redirect(`${baseUrl}/`);
}

export async function forgotPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Vui lòng nhập email' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dat-lai-mat-khau`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithGoogle(formData?: FormData) {
  const supabase = await createClient();
  
  // Dynamically determine origin from request headers
  const { headers } = await import('next/headers');
  const headerStore = await headers();
  const origin = headerStore.get('origin') 
    || headerStore.get('x-forwarded-host') && `https://${headerStore.get('x-forwarded-host')}`
    || process.env.NEXT_PUBLIC_APP_URL 
    || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    console.error('Lỗi đăng nhập Google:', error.message);
    return;
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function resetPassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return { error: 'Vui lòng nhập mật khẩu mới' };
  }

  if (password.length < 8) {
    return { error: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }

  if (password !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    if (error.message.includes('same password')) {
      return { error: 'Mật khẩu mới phải khác mật khẩu cũ' };
    }
    return { error: error.message };
  }

  return { success: true };
}

