import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const pathname = request.nextUrl.pathname

  // Gate the app routes: anyone not logged in gets bounced to /login.
  const protectedPrefixes = ['/learn', '/vocabulary', '/characters', '/lesson', '/admin']
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // /admin is stricter: logged in is not enough, the profile role must be admin.
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.sub)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/learn'
      return NextResponse.redirect(url)
    }
  }

  // Inverse gate: a logged-in user has no business on the landing page or
  // login screen — send them straight into the app.
  const authRoutes = ['/', '/login']
  if (user && authRoutes.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/learn'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}