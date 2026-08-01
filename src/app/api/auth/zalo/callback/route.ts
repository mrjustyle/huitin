import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Bắt buộc Next.js không được build tĩnh (prerender) file API này
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Khởi tạo Supabase Admin Client bên trong hàm để tránh lỗi lúc build (thiếu env)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const appId = process.env.NEXT_PUBLIC_ZALO_APP_ID;
  const secretKey = process.env.ZALO_SECRET_KEY;

  if (!code) {
    return NextResponse.redirect(`${origin}/dang-nhap?error=Thiếu mã Zalo code`);
  }

  if (!appId || !secretKey) {
    return NextResponse.redirect(`${origin}/dang-nhap?error=Hệ thống chưa cấu hình Zalo`);
  }

  try {
    // 1. Đổi code lấy Access Token của Zalo
    const tokenRes = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        secret_key: secretKey,
      },
      body: new URLSearchParams({
        app_id: appId,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(`Zalo Token Error: ${tokenData.error_description}`);
    }
    const accessToken = tokenData.access_token;

    // 2. Lấy thông tin Profile (ID, Name, Phone) từ Zalo
    const profileRes = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture,phone', {
      headers: {
        access_token: accessToken,
      },
    });

    const profileData = await profileRes.json();
    if (profileData.error) {
      throw new Error(`Zalo Profile Error: ${profileData.message}`);
    }

    const { id: zaloId, name: fullName, phone: zaloPhone } = profileData;

    // Nếu Zalo không trả về SĐT, bắt người dùng phải nhập tay SĐT
    if (!zaloPhone) {
      return NextResponse.redirect(
        `${origin}/dang-ky?zalo_id=${zaloId}&name=${encodeURIComponent(fullName || '')}&error=Vui lòng nhập số điện thoại để hoàn tất`
      );
    }

    // Chuẩn hóa SĐT về E.164 (VD: +84912345678)
    let rawPhone = zaloPhone.toString();
    let phone = rawPhone.replace(/\s+/g, '');
    if (phone.startsWith('0')) phone = '+84' + phone.slice(1);
    else if (phone.startsWith('84')) phone = '+' + phone;
    else if (!phone.startsWith('+')) phone = '+' + phone;

    // Email ảo ẩn dưới nền để phục vụ tính năng Magic Link của Zalo
    // (Vì Supabase Admin API không hỗ trợ tạo Magic Link bằng số điện thoại)
    const hiddenEmail = `${phone.replace('+', '')}@zalo.huitin.com`;

    // 3. Tìm xem có User nào đang giữ Số điện thoại này chưa (Cơ chế gộp tài khoản Hướng 2)
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    let user = usersData.users.find((u) => u.phone === phone);

    // 4. Xử lý Logic
    if (!user) {
      // 4a. Số điện thoại mới tinh -> Tạo tài khoản mới
      const { data: newUserRes, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: hiddenEmail,
        email_confirm: true,
        phone: phone,
        phone_confirm: true,
        user_metadata: {
          full_name: fullName,
          zalo_id: zaloId,
        },
      });

      if (createError) throw createError;
      user = newUserRes.user;
    } else {
      // 4b. Đã có tài khoản mang số điện thoại này (Tạo qua OTP hoặc Google+Link Phone)
      // Cập nhật Zalo ID và gắn hiddenEmail (nếu họ chỉ có SĐT) để xài Magic Link
      const updateData: any = {
        user_metadata: { ...user.user_metadata, zalo_id: zaloId },
      };
      
      if (!user.email) {
        updateData.email = hiddenEmail;
        updateData.email_confirm = true;
      }
      
      await supabaseAdmin.auth.admin.updateUserById(user.id, updateData);
      
      // Update local user object so we use the correct email for the magic link
      user.email = user.email || hiddenEmail;
    }

    // 5. Sinh Magic Link ẩn dựa trên Email của tài khoản
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    });

    if (linkError) throw linkError;

    // 6. Chuyển hướng trình duyệt đến Magic Link (Supabase tự xử lý auth rồi đá về /trang-chu)
    return NextResponse.redirect(linkData.properties.action_link);

  } catch (error: any) {
    console.error('Zalo Callback Logic Error:', error);
    return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent('Đăng nhập Zalo thất bại: ' + error.message)}`);
  }
}
