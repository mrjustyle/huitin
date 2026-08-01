import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Admin Client (để vượt quyền tạo user/sinh magic link)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: Request) {
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

    // Chuẩn hóa SĐT (ví dụ Zalo trả về 84912345678 -> 0912345678)
    let phone = zaloPhone.toString();
    if (phone.startsWith('84')) phone = '0' + phone.slice(2);
    if (phone.startsWith('+84')) phone = '0' + phone.slice(3);

    const email = `${phone}@huitin.com`;

    // 3. Kiểm tra xem User này đã có trong Supabase chưa bằng Email giả lập
    const { data: existingUserRes } = await supabaseAdmin.auth.admin.getUserById(email); // getUserById actually takes UUID. Wait.
    // We should use listUsers or just try to generateLink directly!
    // If the user doesn't exist, generateLink will fail or we can just try to create the user first.

    // Hãy thử lấy user bằng Admin API
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    let user = usersData.users.find((u) => u.email === email);

    // 4. Nếu chưa có, tự động tạo tài khoản mới (Account Linking / Auto Signup)
    if (!user) {
      const { data: newUserRes, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        phone: phone,
        user_metadata: {
          full_name: fullName,
          zalo_id: zaloId,
        },
      });

      if (createError) throw createError;
      user = newUserRes.user;
    } else {
      // Gộp Zalo ID vào tài khoản hiện tại nếu chưa có
      if (user.user_metadata?.zalo_id !== zaloId) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, zalo_id: zaloId },
        });
      }
    }

    // 5. Sinh Magic Link ẩn để cấp Session Token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (linkError) throw linkError;

    // 6. Chuyển hướng trình duyệt đến Magic Link (Supabase tự xử lý auth rồi đá về /trang-chu)
    return NextResponse.redirect(linkData.properties.action_link);

  } catch (error: any) {
    console.error('Zalo Callback Logic Error:', error);
    return NextResponse.redirect(`${origin}/dang-nhap?error=${encodeURIComponent('Đăng nhập Zalo thất bại: ' + error.message)}`);
  }
}
