import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
    // If Supabase env vars aren't set, skip authentication
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase environment variables not set. Skipping authentication middleware.');
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make your app
    // very slow as every route will pause.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/setup-credentials', '/auth/callback', '/api', '/sos'];
    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute && request.nextUrl.pathname !== '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If user exists, check their role and redirect accordingly
    if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login')) {
        // Get user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const url = request.nextUrl.clone();
        if (profile?.role === 'admin') {
            url.pathname = '/admin';
        } else {
            url.pathname = '/worker';
        }
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
