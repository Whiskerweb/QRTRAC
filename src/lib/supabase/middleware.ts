import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const TRAAACTION_LOGIN = 'https://traaaction.com/login';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = isProduction ? '.traaaction.com' : undefined;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
            })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protéger les routes /dashboard/* — rediriger vers traaaction.com/login
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(TRAAACTION_LOGIN);
  }

  // Rediriger vers /dashboard si déjà connecté sur /login ou /signup
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
