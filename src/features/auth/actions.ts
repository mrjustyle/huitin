'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type AuthState = {
  error?: string;
  success?: boolean;
} | undefined;

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  if (!email || !password || !fullName) {
    return { error: 'Vui lòng điền đầy đủ thông tin' };
  }

  if (password.length < 8) {
    return { error: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone || undefined,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Email này đã được đăng ký' };
    }
    return { error: error.message };
  }

  return { success: true };
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Vui lòng nhập email và mật khẩu' };
  }

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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
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

