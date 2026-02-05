import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================================================
// STORE ADMIN MIDDLEWARE - PROTECT ADMIN ROUTES
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /store/admin routes
  if (!pathname.startsWith('/store/admin')) {
    return NextResponse.next();
  }

  // Skip middleware for login page
  if (pathname === '/store/admin/login') {
    return NextResponse.next();
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    const loginUrl = new URL('/store/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is admin
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id, role')
    .eq('user_id', user.id)
    .single();

  if (adminError || !admin) {
    // User is not an admin
    return NextResponse.redirect(new URL('/store', request.url));
  }

  // Add admin info to headers for use in components
  const response = NextResponse.next();
  response.headers.set('x-admin-id', admin.id);
  response.headers.set('x-admin-role', admin.role);

  return response;
}

export const config = {
  matcher: ['/store/admin/:path*'],
};
