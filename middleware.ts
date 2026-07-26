import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ chạy middleware cho các route admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Tạo Supabase client từ cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Kiểm tra đã đăng nhập chưa
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Chưa đăng nhập → redirect về trang đăng nhập
    const loginUrl = new URL('/dang-nhap', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Kiểm tra quyền admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'support';

  if (!isAdmin) {
    // Không có quyền → redirect về trang chủ với thông báo
    const homeUrl = new URL('/trang-chu', request.url);
    homeUrl.searchParams.set('error', 'no_admin');
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Chỉ áp dụng cho /admin và các sub-route
    '/admin',
    '/admin/:path*',
  ],
};
