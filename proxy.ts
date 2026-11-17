import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

// Optimistic gate for the tracker: cookie check only, no DB. The pages and API
// routes re-verify the session themselves (lib/auth/dal.ts).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)

  if (pathname.startsWith('/tracker') && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/tracker', req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/tracker/:path*', '/login'],
}
