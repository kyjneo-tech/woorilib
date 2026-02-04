import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 관리자 이메일 리스트
const ADMIN_EMAILS = [
  'admin@woorilib.com',
  process.env.ADMIN_EMAIL
].filter(Boolean); // Remove undefined/null

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isApiAdminPath = request.nextUrl.pathname.startsWith('/api/admin');
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminPath || isApiAdminPath) {
    // 1. 로그인이 안 되어 있으면
    if (!user) {
      if (isApiAdminPath) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. 로그인은 되어 있으나 관리자가 아니면
    const userEmail = user.email;
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      console.warn(`[Security] Unauthorized access attempt by ${userEmail}`);
      if (isApiAdminPath) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};