'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export type AuthState = {
  error?: string;
  success?: boolean;
} | undefined;

function formatPhone(p: string) {
  let cleaned = p.replace(/\s+/g, '');
  if (cleaned.startsWith('0')) return '+84' + cleaned.slice(1);
  if (cleaned.startsWith('84')) return '+' + cleaned;
  if (!cleaned.startsWith('+')) return '+' + cleaned;
  return cleaned;
}

export async function sendPhoneOTP(phone: string) {
  const formattedPhone = formatPhone(phone);

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Check if it's a test phone number to bypass SMS API
  const testPhones = (process.env.TEST_PHONE_NUMBERS || '').split(',').map(p => p.trim() ? formatPhone(p.trim()) : '');
  const isTestPhone = testPhones.includes(formattedPhone);

  // 1. Generate 6-digit OTP (Hardcode to 123456 for test numbers)
  const otp = isTestPhone ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // 2. Save OTP to DB
  await supabaseAdmin.from('auth_otps').delete().eq('phone', formattedPhone);
  const { error: dbError } = await supabaseAdmin
    .from('auth_otps')
    .insert({ phone: formattedPhone, otp, expires_at: expiresAt });

  if (dbError) {
    console.error('Lỗi lưu OTP:', dbError);
    throw new Error('Lỗi hệ thống khi tạo OTP');
  }

  if (isTestPhone) {
    console.log(`[TEST MODE] Bỏ qua gọi API SpeedSMS cho số ${formattedPhone}. Mã OTP là: ${otp}`);
    return true;
  }

  // 3. Send SMS via SpeedSMS
  const smsToken = process.env.SPEEDSMS_API_TOKEN;
  if (!smsToken) throw new Error('Chưa cấu hình SpeedSMS Token');

  let speedPhone = formattedPhone.replace('+', '');

  // LOG OTP CHO MỤC ĐÍCH TESTING
  console.log('\n\n=========================================');
  console.log(`MÃ SMS OTP CỦA SĐT ${speedPhone} LÀ: ${otp}`);
  console.log('=========================================\n\n');

  try {
    const res = await fetch('https://api.speedsms.vn/index.php/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(smsToken + ':x').toString('base64')
      },
      body: JSON.stringify({
        to: speedPhone,
        content: `Ma xac thuc HUI TIN cua ban la: ${otp}. Vui long khong chia se ma nay cho bat ky ai.`,
        sms_type: 4,
        sender: 'Verify'
      })
    });

    const speedData = await res.json();
    if (speedData.status !== 'success') {
      console.error('SpeedSMS Error:', speedData);
      // KHÔNG ném lỗi để dev có thể test OTP qua console
      console.warn('CẢNH BÁO: SpeedSMS gửi lỗi nhưng vẫn cho phép test qua Console.');
    }
  } catch (err) {
    console.error('Lỗi gọi API SpeedSMS:', err);
  }
  return true;
}

export async function verifyPhoneOTP(phone: string, otp: string) {
  const formattedPhone = formatPhone(phone);

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 1. Check OTP in DB
  const { data: otpRecords, error: fetchError } = await supabaseAdmin
    .from('auth_otps')
    .select('*')
    .eq('phone', formattedPhone)
    .eq('otp', otp)
    .gte('expires_at', new Date().toISOString());

  if (fetchError || !otpRecords || otpRecords.length === 0) {
    throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
  }

  // Delete the used OTP
  await supabaseAdmin.from('auth_otps').delete().eq('id', otpRecords[0].id);

  // 2. Find or create user via Admin API
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();

  // Supabase returns phone WITHOUT the plus sign, so we need to compare safely
  const searchPhone = formattedPhone.replace('+', '');
  let user = usersData.users.find((u) => u.phone === searchPhone);

  const hiddenEmail = `${searchPhone}@sms.huitin.com`;

  if (!user) {
    const { data: newUserRes, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: hiddenEmail,
      email_confirm: true,
      phone: formattedPhone,
      phone_confirm: true,
    });
    if (createError) throw createError;
    user = newUserRes.user;
  } else {
    // Ensure hidden email exists for magic link
    if (!user.email) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: hiddenEmail,
        email_confirm: true
      });
      user.email = hiddenEmail;
    }
  }

  // Bỏ qua tạo Magic Link. Đăng nhập sẽ thực hiện sau khi user thiết lập mã PIN.
  return { success: true };
}

export async function setPhonePin(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const rawPassword = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const phone = formData.get('phone') as string;

  if (!rawPassword) {
    return { error: 'Vui lòng nhập Mã PIN' };
  }

  if (rawPassword.length < 6) {
    return { error: 'Mã PIN phải có đủ 6 số' };
  }

  if (!phone) {
    return { error: 'Lỗi: Không tìm thấy số điện thoại' };
  }

  const password = rawPassword + 'Huitin@2026';

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const formattedPhone = formatPhone(phone);
  const searchPhone = formattedPhone.replace('+', '');

  // Find user by phone
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const user = usersData.users.find((u) => u.phone === searchPhone);

  if (!user) {
    return { error: 'Không tìm thấy tài khoản người dùng' };
  }

  // Set password via admin API
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: { ...user.user_metadata, full_name: fullName || user.user_metadata.full_name }
  });

  if (fullName) {
    // Also explicitly update the user_profiles table since the auth trigger only runs on insert
    await supabaseAdmin
      .from('user_profiles')
      .update({ full_name: fullName, nickname: fullName })
      .eq('id', user.id);
  }

  if (updateError) {
    console.error('Set PIN Error:', updateError);
    return { error: 'Không thể thiết lập Mã PIN, vui lòng thử lại.' };
  }

  // Log them in using client API (to set cookies)
  const supabase = await createClient();
  const hiddenEmail = `${searchPhone}@sms.huitin.com`;
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: hiddenEmail,
    password,
  });

  if (signInError) {
    console.error('Login after PIN Error:', signInError);
    return { error: 'Tạo mã PIN thành công nhưng lỗi tự động đăng nhập. Vui lòng thử đăng nhập lại.' };
  }

  return { success: true };
}

export async function signInWithPhonePin(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const rawPhone = formData.get('phone') as string;
  const rawPassword = formData.get('password') as string;

  if (!rawPhone || !rawPassword) {
    return { error: 'Vui lòng nhập số điện thoại và Mã PIN' };
  }

  const phone = formatPhone(rawPhone);
  const password = rawPassword.length === 6 ? rawPassword + 'Huitin@2026' : rawPassword;

  const supabase = await createClient();
  const searchPhone = phone.replace('+', '');
  const hiddenEmail = `${searchPhone}@sms.huitin.com`;

  const { error } = await supabase.auth.signInWithPassword({
    email: hiddenEmail,
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

export async function linkPhone(phone: string) {
  const formattedPhone = formatPhone(phone);

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Check if phone already registered by another user
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();

  // Supabase returns phone WITHOUT the plus sign, so we need to compare safely
  const searchPhone = formattedPhone.replace('+', '');
  const existingUser = usersData.users.find(u => u.phone === searchPhone);

  if (existingUser) {
    throw new Error('Số điện thoại này đã có tài khoản trên Hụi Tín. Vui lòng đăng xuất và đăng nhập bằng Số điện thoại!');
  }

  // Check if it's a test phone number to bypass SMS API
  const testPhones = (process.env.TEST_PHONE_NUMBERS || '').split(',').map(p => p.trim() ? formatPhone(p.trim()) : '');
  const isTestPhone = testPhones.includes(formattedPhone);

  // 1. Generate 6-digit OTP
  const otp = isTestPhone ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // 2. Save OTP to DB
  await supabaseAdmin.from('auth_otps').delete().eq('phone', formattedPhone);
  const { error: dbError } = await supabaseAdmin
    .from('auth_otps')
    .insert({ phone: formattedPhone, otp, expires_at: expiresAt });

  if (dbError) {
    console.error('Lỗi lưu OTP:', dbError);
    throw new Error('Lỗi hệ thống khi tạo OTP');
  }

  if (isTestPhone) {
    console.log(`[TEST MODE] Bỏ qua gọi API SpeedSMS cho số ${formattedPhone}. Mã OTP là: ${otp}`);
    return true;
  }

  // 3. Send SMS via SpeedSMS
  const smsToken = process.env.SPEEDSMS_API_TOKEN;
  if (!smsToken) throw new Error('Chưa cấu hình SpeedSMS Token');

  let speedPhone = formattedPhone.replace('+', '');

  // LOG OTP CHO MỤC ĐÍCH TESTING
  console.log('\n\n=========================================');
  console.log(`MÃ LINK PHONE OTP CỦA SĐT ${speedPhone} LÀ: ${otp}`);
  console.log('=========================================\n\n');

  try {
    const res = await fetch('https://api.speedsms.vn/index.php/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(smsToken + ':x').toString('base64')
      },
      body: JSON.stringify({
        to: speedPhone,
        content: `Ma xac thuc HUI TIN cua ban la: ${otp}. Vui long khong chia se ma nay cho bat ky ai.`,
        sms_type: 4,
        sender: 'Verify'
      })
    });

    const speedData = await res.json();
    if (speedData.status !== 'success') {
      console.error('SpeedSMS Error:', speedData);
      console.warn('CẢNH BÁO: SpeedSMS gửi lỗi nhưng vẫn cho phép test qua Console.');
    }
  } catch (err) {
    console.error('Lỗi gọi API SpeedSMS:', err);
  }

  return true;
}

export async function verifyLinkPhoneOTP(phone: string, otp: string) {
  const supabaseUser = await createClient(); // Get current user session
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) throw new Error('Bạn chưa đăng nhập');

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const formattedPhone = formatPhone(phone);

  // 1. Check OTP in DB
  const { data: otpRecords, error: fetchError } = await supabaseAdmin
    .from('auth_otps')
    .select('*')
    .eq('phone', formattedPhone)
    .eq('otp', otp)
    .gte('expires_at', new Date().toISOString());

  if (fetchError || !otpRecords || otpRecords.length === 0) {
    throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
  }

  // Delete the used OTP
  await supabaseAdmin.from('auth_otps').delete().eq('id', otpRecords[0].id);

  // 2. Update user phone using Admin API to bypass OTP check
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    phone: formattedPhone,
    phone_confirm: true
  });

  if (updateError) {
    throw new Error('Lỗi liên kết số điện thoại: ' + updateError.message);
  }

  return { success: true };
}
