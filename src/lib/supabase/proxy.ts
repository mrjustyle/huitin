import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip Supabase auth if env vars not configured yet
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ['/trang-chu', '/day-hui', '/tai-khoan', '/kyc'];
  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dang-nhap';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes — redirect if not admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dang-nhap';
      return NextResponse.redirect(url);
    }
    // Admin role check would be done in the page/layout with DB query
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/dang-nhap', '/dang-ky'];
  const isAuthRoute = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/trang-chu';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
